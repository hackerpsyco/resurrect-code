const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { scanFile, generateChatResponse, reviewCommitDiff, fixFileCode } = require('./services/groqService');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ 
  origin: ['http://localhost:8080', 'https://www.innoalaxy.in'], 
  credentials: true 
}));
app.use(express.json());

// Database Pool (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Run startup migrations
pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;')
  .then(() => console.log('✅ total_tokens safe column added successfully!'))
  .catch(err => console.error('❌ Startup Migration Failed:', err.message));

app.get('/api/admin/setup-table', async (req, res) => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;');
    res.send('✅ total_tokens safe column added successfully!');
  } catch (err) {
    res.status(500).send(`❌ Failed: ${err.message}`);
  }
});

// ==========================================
// 🔐 AUTHENTICATION ENDPOINTS (GitHub OAuth)
// ==========================================

// 1. Redirect to GitHub
app.get('/api/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://resurrect-code-lzgz.vercel.app/api/auth/github/callback';
  const scope = 'repo workflow read:user';
  
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured in backend/.env' });
  }

  const origin = req.query.origin || 'https://www.innoalaxy.in';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(origin)}`;
  res.redirect(githubAuthUrl);
});

// 2. Callback from GitHub
app.get('/api/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!code) return res.status(400).json({ error: 'Code not found' });

  try {
    // A. Exchange code for access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
    const accessToken = tokenData.access_token;

    // B. Fetch User profile from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await userResponse.json();

    // C. Upsert user into Neon Database
    const upsertQuery = `
      INSERT INTO users (github_id, username, email, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (github_id) DO UPDATE 
      SET username = $2, email = $3, avatar_url = $4
      RETURNING id, username
    `;
    
    const dbResult = await pool.query(upsertQuery, [
      String(profile.id), 
      profile.login, 
      profile.email || null, 
      profile.avatar_url
    ]);
    
    const userId = dbResult.rows[0].id;

    // D. Generate JWT Token
    const payload = { userId, username: profile.login, githubToken: accessToken };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    // E. Redirect back to frontend dashboard with Token
    // Defaulting to production domain instead of localhost fallback
    const redirectBack = state || 'https://www.innoalaxy.in';
    res.redirect(`${redirectBack}/dashboard?token=${jwtToken}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err.message);
    res.status(500).json({ error: 'OAuth failed', details: err.message });
  }
});

// ==========================================
// 🛡️ PROTECTED ENDPOINTS (Requires Token)
// ==========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user includes userId, username, githubToken
    next();
  });
};

// 1. Get Me (User profile from token)
app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Repositories to connect
app.get('/api/repos', authenticateToken, async (req, res) => {
  try {
    let allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}`, {
        headers: { 
          'Authorization': `Bearer ${req.user.githubToken}`,
          'User-Agent': 'ResurrectCI-Backend'
        }
      });
      const repos = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: repos.message || 'GitHub API error' });
      }

      allRepos = allRepos.concat(repos);
      hasMore = repos.length === 100; // If we got 100 repos, there might be more
      page++;
    }
    res.json(allRepos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Fetch Monitored Repositories
app.get('/api/monitored-repos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT repo_full_name FROM monitored_repos WHERE user_id = $1', [req.user.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Generic GitHub API Proxy (Mimics Supabase Edge Function to avoid breaking frontend)
app.post('/api/github-api', authenticateToken, async (req, res) => {
  const { action, owner, repo, branch, path, content, message, sha } = req.body;
  const githubToken = req.user.githubToken;

  if (!githubToken) {
    return res.status(401).json({ success: false, error: 'No GitHub token found in session' });
  }

  try {
    let url = '';
    let method = 'GET';
    let body = null;
    
    const headers = { 
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ResurrectCI-Backend'
    };

    if (action === 'get_repo') {
      url = `https://api.github.com/repos/${owner}/${repo}`;
    } else if (action === 'get_tree') {
      const targetBranch = branch || 'main';
      url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`;
    } else if (action === 'get_file') {
      const targetBranch = branch || 'main';
      url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${targetBranch}`;
    } else if (action === 'update_file') {
      url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      method = 'PUT';
      body = {
        message: message || `Update ${path}`,
        content: Buffer.from(content || '').toString('base64'),
        sha: sha || undefined,
        branch: branch || 'main'
      };
    } else if (action === 'get_commits') {
      url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`;
    } else {
      return res.status(400).json({ success: false, error: 'Unknown action type' });
    }

    console.log(`Forwarding ${action} to GitHub: ${method} ${url}`);
    
    const response = await fetch(url, { 
      method, 
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const responseData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: responseData.message || 'GitHub API error' });
    }

    // Decode content for "get_file" specifically to match edge function structure
    if (action === 'get_file' && responseData.content) {
      try {
        responseData.decodedContent = Buffer.from(responseData.content.replace(/\s/g, ''), 'base64').toString('utf-8');
      } catch (err) {
        console.warn(`Failed to decode content for ${path}:`, err);
      }
    }

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Groq AI Integration Endpoints
// ==========================================

// 1. Scan Single File with AI
app.post('/api/ai/scan-file', authenticateToken, async (req, res) => {
  try {
    const { content, fileName } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'No content provided for scan' });

    const report = await scanFile(content, fileName || 'unknown', req.user.userId);
    res.json({ success: true, issues: report.issues || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fix Single File with AI
app.post('/api/ai/fix-file', authenticateToken, async (req, res) => {
  try {
    const { content, issueDescription, fileName } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'No content provided for fix' });
    if (!issueDescription) return res.status(400).json({ success: false, error: 'No issue description provided' });

    console.log(`🧠 AI Fixing file: ${fileName}`);
    const fixedContent = await fixFileCode(content, issueDescription, fileName || 'unknown', req.user.userId);
    
    res.json({ success: true, fixedContent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. AI Chat (Streaming or Standard Stream context)
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { messages, context, owner, repo } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateChatResponse(messages || [], context || "", owner || "", repo || "", req.user.githubToken);

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (!res.headersSent) {
       res.status(500).json({ success: false, error: err.message });
    } else {
       res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
       res.end();
    }
  }
});
// 4. Monitor Repository Configuration (Auto Webhook Install)
app.post('/api/monitor', authenticateToken, async (req, res) => {
  const { repo_full_name, repo_id } = req.body;
  const userId = req.user.userId;
  const githubToken = req.user.githubToken;

  if (!repo_full_name) {
    return res.status(400).json({ success: false, error: 'repo_full_name is required' });
  }

  // Safe parsing for repo_id to avoid NaN triggering database type errors
  const parsedRepoId = repo_id && !isNaN(parseInt(repo_id)) ? parseInt(repo_id) : null;

  try {
    // A. Verify/Insert into Monitored Repos in Neon DB
    const checkQuery = 'SELECT id FROM monitored_repos WHERE repo_full_name = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [repo_full_name, userId]);
    
    if (checkResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO monitored_repos (user_id, repo_full_name, repo_id, github_token) VALUES ($1, $2, $3, $4)', 
        [userId, repo_full_name, parsedRepoId, githubToken || null]
      );
    } else {
      await pool.query(
        'UPDATE monitored_repos SET github_token = $1 WHERE id = $2',
        [githubToken || null, checkResult.rows[0].id]
      );
    }

    // B. Install Github Webhook Autopilot
    const [owner, repoName] = repo_full_name.split('/');
    const webhookUrl = `${process.env.BACKEND_URL || 'https://resurrect-code-lzgz.vercel.app'}/api/webhook/github`;

    const webhookResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ResurrectCI-Backend'
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json'
        }
      })
    });

    const webhookData = await webhookResponse.json();

    if (!webhookResponse.ok) {
       const errorsStr = webhookData.errors ? JSON.stringify(webhookData.errors) : '';
       const isDuplicate = errorsStr.toLowerCase().includes('already exists') || 
                           (webhookData.message && webhookData.message.toLowerCase().includes('already exists'));

       if (webhookResponse.status === 422 && isDuplicate) {
          return res.json({ success: true, message: 'Repository Monitored. Webhook is already live on GitHub.' });
       }
       throw new Error(`GitHub Webhook failed: ${errorsStr || webhookData.message || webhookResponse.statusText}`);
    }

    res.json({ success: true, message: 'Monitoring enabled. Webhook installed successfully!', webhook: webhookData.id });

  } catch (err) {
    console.error('🔴 Monitor API Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GitHub Webhook for Push Events (Code Quality Code Review)
app.post('/api/webhook/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  if (event !== 'push') {
    return res.status(200).json({ message: 'Ignored event' });
  }

  const { ref, before, after, repository } = req.body;
  if (!repository || !before || !after) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const repoFullName = repository.full_name;
  const owner = repository.owner.login;
  const repoName = repository.name;
  const branch = ref ? ref.replace('refs/heads/', '') : 'main';

  console.log(`📥 Received GitHub Push Webhook for ${repoFullName} [${branch}]`);

  try {
    // A. Find matching monitored repo to get access token to compare diffs
    const repoResult = await pool.query(
      'SELECT github_token, user_id FROM monitored_repos WHERE repo_full_name = $1 LIMIT 1',
      [repoFullName]
    );

    if (repoResult.rows.length === 0) {
      console.log(`⚠️ Repo ${repoFullName} not in monitored_repos. Skipping review.`);
      return res.status(200).json({ message: 'Repo not monitored' });
    }

    const githubToken = repoResult.rows[0].github_token;
    const webhookUserId = repoResult.rows[0].user_id;

    // B. Fetch Compare Diff from GitHub
    const compareUrl = `https://api.github.com/repos/${owner}/${repoName}/compare/${before}...${after}`;
    console.log(`🔍 Fetching diff from: ${compareUrl}`);

    const compareResponse = await fetch(compareUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ResurrectCI-Backend'
      }
    });

    if (!compareResponse.ok) {
      throw new Error(`Failed to fetch diff from GitHub: ${compareResponse.statusText}`);
    }

    const compareData = await compareResponse.json();
    const files = compareData.files || [];

    if (files.length === 0) {
      return res.status(200).json({ message: 'No file changes found' });
    }

    // C. Combine patches into a single diff string format
    let combineDiff = "";
    for (const file of files) {
      if (file.patch) {
        combineDiff += `\n\n--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`;
      }
    }

    if (!combineDiff) {
      return res.status(200).json({ message: 'No diff text found' });
    }

    // D. Run Groq Code Review
    console.log(`🧠 Running AI Code Review for commit ${after}`);
    const reviewResult = await reviewCommitDiff(combineDiff, '', webhookUserId);
    console.log(`✅ AI Review complete for ${after}`);

    // E. Save to Database
    const insertReviewQuery = `
      INSERT INTO code_reviews (repo_full_name, commit_sha, branch, author, summary, issues, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await pool.query(insertReviewQuery, [
      repoFullName,
      after,
      branch,
      req.body.pusher?.name || 'unknown',
      reviewResult.summary || 'No summary available',
      JSON.stringify(reviewResult.issues || []),
      (reviewResult.issues?.length > 0) ? 'issues_found' : 'passed'
    ]);

    // F. Notify User via Commit Comment
    if (reviewResult.issues?.length > 0) {
       const commentBody = `### 🤖 AI Code Quality Review (Senior Developer)

**Summary**: ${reviewResult.summary}
**Score**: ${reviewResult.score || 'N/A'}/100

#### ⚠️ Issues Found:
${reviewResult.issues.map((i, idx) => `${idx + 1}. **${i.severity.toUpperCase()}** - \`${i.file}${i.line ? `:${i.line}` : ''}\`: ${i.description}\n   *👉 Fix*: ${i.fix}`).join('\n\n')}
`;

       const commentUrl = `https://api.github.com/repos/${owner}/${repoName}/commits/${after}/comments`;
       await fetch(commentUrl, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${githubToken}`,
           'Accept': 'application/vnd.github.v3+json',
           'Content-Type': 'application/json',
           'User-Agent': 'ResurrectCI-Backend'
         },
         body: JSON.stringify({ body: commentBody })
       });
       console.log(`💬 Posted comment to Github commit ${after}`);
    }

    res.status(200).json({ success: true, message: 'Review completed', summary: reviewResult.summary });

  } catch (err) {
    console.error('🔴 Webhook Processing Error:', err.message);
    // Don't error out webhook API if it's just processing, return 200 with error so Github doesn't retry indefinitely while we fix bugs
    res.status(200).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 ResurrectCI Backend running on http://localhost:${PORT}`));
}
module.exports = app;
