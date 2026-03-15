const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Executes an operation with exponential backoff on 429 Rate Limits.
 */
async function retryWithBackoff(operation, maxRetries = 4, baseDelay = 5000) {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                         error.status === 413 || 
                         error.message?.includes('429') || 
                         error.message?.includes('rate_limit') ||
                         error.message?.includes('quota');
                         
      if (isRateLimit && attempt <= maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`⏳ Groq Rate Limit hit. Waiting ${delay / 1000}s before retry... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Scans file content for bugs, performance issues, and standards.
 */
async function scanFile(content, fileName) {
  const prompt = `You are a Senior Software Architect and security auditor.
Analyze the following file: "${fileName}" for:
1. Critical bugs and security vulnerabilities.
2. Warnings (performance, code smells, duplicate code).
3. Informational improvements (standards, readability).

Respond ONLY with a JSON object containing an array of issues.
Format:
{
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "line": 42,
      "description": "Problem description...",
      "fix": "Concrete fix suggestion or replacement code..."
    }
  ]
}

File Content:
\`\`\`
${content}
\`\`\`
`;

  const response = await retryWithBackoff(() => groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1, // Low temp for structured analysis
  }));

  const text = response.choices[0]?.message?.content || '{}';
  
  try {
    // Attempt to parse JSON (sometimes models include markdown backticks, so let's strip them)
    const jsonString = text.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Failed to parse Groq response:', text);
    throw new Error('Groq returned malformed JSON reports');
  }
}

/**
 * Memory cache for project design/summaries loaded dynamically
 */
const projectContextCache = {};

/**
 * Loads and summarizes the README.md of a repository to provide Architect scope.
 */
async function getProjectContext(owner, repo, token) {
  if (!owner || !repo || !token) return "No repository scope provided.";
  const key = `${owner}/${repo}`;
  if (projectContextCache[key]) return projectContextCache[key];

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3.raw' }
    });

    if (!response.ok) return "No README.md found in repository root.";

    const readmeContent = await response.text();
    
    // Quick summarize with Groq
    const res = await groq.chat.completions.create({
       messages: [{ 
         role: 'user', 
         content: `You are a Senior Software Architect. Analyze and summarize this project README.md efficiently for system prompts. Focus on Purpose, Tech Stack, and High-level architecture in 3 paragraphs maximum:\n\n${readmeContent.substring(0, 4000)}` 
       }],
       model: 'llama-3.3-70b-versatile',
       temperature: 0.3
    });

    const summary = res.choices[0]?.message?.content || "No project overview available.";
    projectContextCache[key] = summary;
    return summary;
  } catch (err) {
    console.error('getProjectContext Error:', err);
    return "Error fetching project context references.";
  }
}

/**
 * Generates streamable responses for AI Chat interfaces.
 */
async function generateChatResponse(messages, context = '', owner = '', repo = '', token = '') {
  let projectContext = "";
  if (owner && repo && token) {
     projectContext = await getProjectContext(owner, repo, token);
  }

  const systemPrompt = {
    role: 'system',
    content: `You are an expert AI Senior Architect assistant inside the ResurrectCI IDE workspace.
Use the following workspace context and guidelines to answer the user as best as possible:

---
[Project Overview]
${projectContext}

---
[Current Editor Context]
${context}

Guidelines:
1. Always reply concisely in markdown format.
2. Provide direct code fixes or explanations layout cleanly.
3. Include code snippets inside fences.
4. Maintain a professional, Senior Architect tone helping a learner.`
  };

  const formattedMessages = [systemPrompt, ...messages];

  return retryWithBackoff(() => groq.chat.completions.create({
    messages: formattedMessages,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    stream: true
  }));
}

/**
 * Reviews a commit diff for code quality, bugs, and improvements.
 */
async function reviewCommitDiff(diffContent, projectContext = '') {
  const prompt = `You are a Senior Software Architect and code reviewer.
Analyze the following git diff for code quality issues, bugs, security vulnerabilities, or anti-patterns:

[Project Overview/Context]
${projectContext}

[Git Diff]
\`\`\`diff
${diffContent}
\`\`\`

Provide your review ONLY in valid JSON format.
Format:
{
  "summary": "Brief explanation of what the diff changes and overall impact.",
  "score": 85, 
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "file": "file_name.js",
      "line": 12, 
      "description": "Problem description...",
      "fix": "Concrete fix suggestion..."
    }
  ]
}
`;

  const response = await retryWithBackoff(() => groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1, // Low temp for structured analysis
  }));

  const text = response.choices[0]?.message?.content || '{}';
  
  try {
    const jsonString = text.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Failed to parse Groq response:', text);
    throw new Error('Groq returned malformed JSON reports');
  }
}

/**
 * Fixes code content based on an issue or instruction.
 */
async function fixFileCode(content, issueDescription, fileName) {
  const prompt = `You are an expert developer and security engineer.
Review the following file: "${fileName}" and the description of the issue to solve.

[Issue/Instruction]
${issueDescription}

[File Content]
\`\`\`
${content}
\`\`\`

Based on the issue above, please rewrite the file to address it.
Return **ONLY** the full file content inside a markdown code block.
DO NOT include any explanation or markdown before/after the code block, EXCEPT the code block itself. All changes must be fully implemented, do not use place holders like "// rest of code goes here".
`;

  const response = await retryWithBackoff(() => groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2, // Low temp for code generation
  }));

  const text = response.choices[0]?.message?.content || '';
  
  // Extract content from markdown code block
  const match = text.match(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);
  return match ? match[1] : text;
}

module.exports = {
  scanFile,
  generateChatResponse,
  reviewCommitDiff,
  fixFileCode
};
