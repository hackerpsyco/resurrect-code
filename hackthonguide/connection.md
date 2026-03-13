Got it. Here is your complete guide — shortest possible, everything working.

---

## Your Stack (Picked for You)

```
React + Vite        → Vercel (frontend)
Supabase            → free backend + DB + auth + realtime
Azure OpenAI        → AI analysis (Microsoft hero tech ✅)
GitHub OAuth        → via Supabase (zero extra code)
```

---

## STEP 1 — Supabase Setup (30 min)

**1.1 Create project**
```
supabase.com → New project → name: resurrectci
```

**1.2 Install**
```bash
npm install @supabase/supabase-js
```

**1.3 `src/lib/supabase.js`**
```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**1.4 `.env`**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GITHUB_CLIENT_ID=paste_after_step2
VITE_WEBHOOK_SECRET=any_random_string
```

**1.5 SQL — paste in Supabase → SQL Editor → Run**
```sql
create table monitored_repos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  repo_full_name text,
  repo_id bigint,
  github_token text,
  added_at timestamptz default now()
);

create table build_incidents (
  id uuid default gen_random_uuid() primary key,
  repo_full_name text,
  run_id text,
  branch text,
  error_logs text,
  root_cause text,
  error_type text,
  fix_suggestion text,
  file_to_change text,
  code_change text,
  pr_url text,
  status text default 'detected',
  created_at timestamptz default now()
);
```

---

## STEP 2 — GitHub OAuth (20 min)

**2.1 Create GitHub OAuth App**
```
github.com → Settings → Developer settings
→ OAuth Apps → New OAuth App

Name:         ResurrectCI
Homepage:     http://localhost:5173
Callback:     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```
Copy **Client ID** + generate + copy **Client Secret**

**2.2 Enable in Supabase**
```
Supabase → Authentication → Providers → GitHub
→ Enable → paste Client ID + Secret → Save
```

**2.3 Connect button — this is the entire OAuth flow**
```jsx
// src/components/ConnectGitHub.jsx
import { supabase } from '../lib/supabase'

export default function ConnectGitHub() {
  const connect = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'repo workflow read:user',
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  return <button onClick={connect}>Connect GitHub</button>
}
```

---

## STEP 3 — Dashboard: Repos + Live Feed (1 hr)

```jsx
// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [repos, setRepos]         = useState([])
  const [incidents, setIncidents] = useState([])
  const [session, setSession]     = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setSession(session)
      fetchRepos(session.provider_token)
      fetchIncidents()
    })

    // Realtime — updates UI as agents work
    const ch = supabase.channel('incidents')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'build_incidents' },
        ({ new: row }) => setIncidents(p => {
          const i = p.findIndex(x => x.id === row.id)
          if (i >= 0) { const c = [...p]; c[i] = row; return c }
          return [row, ...p]
        }))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const fetchRepos = async (token) => {
    const r = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=50',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setRepos(await r.json())
  }

  const fetchIncidents = async () => {
    const { data } = await supabase.from('build_incidents')
      .select('*').order('created_at', { ascending: false }).limit(20)
    setIncidents(data || [])
  }

  const monitorRepo = async (repo) => {
    const token = session.provider_token

    // Save repo + token to DB
    await supabase.from('monitored_repos').upsert({
      user_id: session.user.id,
      repo_full_name: repo.full_name,
      repo_id: repo.id,
      github_token: token
    })

    // Install webhook on GitHub repo automatically
    await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['workflow_run'],
        config: {
          url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-receiver`,
          content_type: 'json',
          secret: import.meta.env.VITE_WEBHOOK_SECRET
        }
      })
    })
    alert(`Monitoring ${repo.full_name}`)
  }

  const color = { detected:'#f59e0b', analyzing:'#3b82f6', fixed:'#22c55e', failed:'#ef4444' }

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <h1>ResurrectCI</h1>

      <h2>Select repo to monitor</h2>
      {repos.map(r => (
        <div key={r.id} onClick={() => monitorRepo(r)}
          style={{ padding: '8px 12px', margin: '4px 0', border: '1px solid #333',
            borderRadius: 6, cursor: 'pointer' }}>
          {r.full_name}
        </div>
      ))}

      <h2 style={{ marginTop: 32 }}>Live Agent Activity</h2>
      {incidents.map(inc => (
        <div key={inc.id} style={{ borderLeft: `4px solid ${color[inc.status]}`,
          padding: '12px 16px', margin: '8px 0', background: '#111', borderRadius: 4 }}>
          <strong>{inc.repo_full_name}</strong>
          <span style={{ marginLeft: 8, color: color[inc.status], fontSize: 11 }}>
            {inc.status.toUpperCase()}
          </span>
          <p style={{ color: '#888', margin: '4px 0' }}>Branch: {inc.branch}</p>
          {inc.root_cause    && <p>Root cause: {inc.root_cause}</p>}
          {inc.fix_suggestion && <p>Fix: {inc.fix_suggestion}</p>}
          {inc.pr_url && (
            <a href={inc.pr_url} target="_blank" style={{ color: '#22c55e' }}>
              View Auto-Fix PR →
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## STEP 4 — Azure OpenAI (20 min)

```
portal.azure.com → sign up free ($200 credit)
→ search "Azure OpenAI" → Create
  Region: East US
  Name: resurrectci-ai

→ Azure OpenAI Studio → Deployments → Create
  Model: gpt-4o-mini
  Deployment name: resurrectci-agent

→ Resource → Keys and Endpoint → copy KEY 1 + Endpoint
```

**Add to Supabase secrets:**
```
Supabase → Edge Functions → Secrets:

AZURE_OPENAI_KEY       = your_key
AZURE_OPENAI_ENDPOINT  = https://resurrectci-ai.openai.azure.com/
AZURE_DEPLOYMENT_NAME  = resurrectci-agent
WEBHOOK_SECRET         = same string as VITE_WEBHOOK_SECRET
```

---

## STEP 5 — 3 Agent Edge Functions (2 hrs)

```bash
npm install -g supabase
supabase login
supabase init
supabase functions new webhook-receiver
supabase functions new log-analysis-agent
supabase functions new fix-pr-agent
```

**Agent 1 — `webhook-receiver/index.ts`**
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  if (payload.workflow_run?.conclusion !== 'failure') return new Response('ignored')

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: incident } = await sb.from('build_incidents').insert({
    repo_full_name: payload.repository.full_name,
    run_id: String(payload.workflow_run.id),
    branch: payload.workflow_run.head_branch,
    status: 'detected'
  }).select().single()

  // Fire Agent 2 (no await — non-blocking)
  fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/log-analysis-agent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ incident_id: incident.id, payload })
  })

  return new Response(JSON.stringify({ ok: true }))
})
```

**Agent 2 — `log-analysis-agent/index.ts`**
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { incident_id, payload } = await req.json()
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await sb.from('build_incidents').update({ status: 'analyzing' }).eq('id', incident_id)

  // Get stored GitHub token for this repo
  const { data: conn } = await sb.from('monitored_repos')
    .select('github_token')
    .eq('repo_full_name', payload.repository.full_name)
    .single()

  const gh = { Authorization: `Bearer ${conn.github_token}`, Accept: 'application/vnd.github+json' }

  // Fetch failed job logs
  const jobs = await (await fetch(
    `https://api.github.com/repos/${payload.repository.full_name}/actions/runs/${payload.workflow_run.id}/jobs`,
    { headers: gh }
  )).json()

  let logs = ''
  for (const job of jobs.jobs.filter((j: any) => j.conclusion === 'failure')) {
    const logText = await (await fetch(
      `https://api.github.com/repos/${payload.repository.full_name}/actions/jobs/${job.id}/logs`,
      { headers: gh }
    )).text()
    logs += `\n--- ${job.name} ---\n${logText}`
  }

  // Call Azure OpenAI
  const ai = await (await fetch(
    `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}openai/deployments/${Deno.env.get('AZURE_DEPLOYMENT_NAME')}/chat/completions?api-version=2024-02-01`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': Deno.env.get('AZURE_OPENAI_KEY')! },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a senior DevOps engineer. Analyze CI/CD failures.
Respond ONLY valid JSON, no extra text:
{
  "rootCause": "one sentence",
  "errorType": "dependency_error|syntax_error|config_error|test_failure|env_error",
  "fixSuggestion": "exact steps",
  "fileToChange": "filepath or null",
  "codeChange": "complete corrected file content or null"
}`
          },
          { role: 'user', content: `Fix this build failure:\n\n${logs.slice(0, 6000)}` }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    }
  )).json()

  const analysis = JSON.parse(ai.choices[0].message.content.trim())

  await sb.from('build_incidents').update({
    error_logs: logs.slice(0, 8000),
    root_cause: analysis.rootCause,
    error_type: analysis.errorType,
    fix_suggestion: analysis.fixSuggestion,
    file_to_change: analysis.fileToChange,
    code_change: analysis.codeChange
  }).eq('id', incident_id)

  // Fire Agent 3
  fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fix-pr-agent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      incident_id,
      analysis,
      repo: payload.repository.full_name,
      github_token: conn.github_token
    })
  })

  return new Response('ok')
})
```

**Agent 3 — `fix-pr-agent/index.ts`**
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { incident_id, analysis, repo, github_token } = await req.json()
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const h = {
    Authorization: `Bearer ${github_token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  }

  try {
    // Get main branch SHA
    const ref = await (await fetch(
      `https://api.github.com/repos/${repo}/git/ref/heads/main`, { headers: h }
    )).json()

    // Create fix branch
    const branch = `resurrectci/autofix-${Date.now()}`
    await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha })
    })

    // Commit fix if AI gave a file change
    if (analysis.fileToChange && analysis.codeChange) {
      const existing = await (await fetch(
        `https://api.github.com/repos/${repo}/contents/${analysis.fileToChange}?ref=main`,
        { headers: h }
      )).json()

      await fetch(`https://api.github.com/repos/${repo}/contents/${analysis.fileToChange}`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({
          message: `fix: ${analysis.rootCause} [ResurrectCI]`,
          content: btoa(unescape(encodeURIComponent(analysis.codeChange))),
          sha: existing.sha,
          branch
        })
      })
    }

    // Open PR
    const pr = await (await fetch(`https://api.github.com/repos/${repo}/pulls`, {
      method: 'POST', headers: h,
      body: JSON.stringify({
        title: `[ResurrectCI] Auto-fix: ${analysis.rootCause}`,
        body: `## ResurrectCI Auto-Fix\n\n**Root Cause:** ${analysis.rootCause}\n**Fix:** ${analysis.fixSuggestion}\n\n*Powered by Azure OpenAI*`,
        head: branch,
        base: 'main'
      })
    })).json()

    await sb.from('build_incidents')
      .update({ status: 'fixed', pr_url: pr.html_url }).eq('id', incident_id)

  } catch {
    await sb.from('build_incidents').update({ status: 'failed' }).eq('id', incident_id)
  }

  return new Response('ok')
})
```

**Deploy:**
```bash
supabase functions deploy webhook-receiver
supabase functions deploy log-analysis-agent
supabase functions deploy fix-pr-agent
```

---

## STEP 6 — Deploy to Vercel (10 min)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add env vars in Vercel dashboard → Settings → Environment Variables (same 4 from your `.env`).

Update GitHub OAuth App callback after deploy:
```
Callback URL: https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
Homepage URL: https://your-app.vercel.app
```

---

## Your 5-Day Build Order

| Day | Task |
|-----|------|
| 1 | Supabase + SQL tables + GitHub OAuth button working locally |
| 2 | Dashboard with repo list + monitorRepo() + webhook installs |
| 3 | Azure account + OpenAI deployment + secrets in Supabase |
| 4 | Deploy 3 agents + test with a real failing repo |
| 5 | UI polish + architecture diagram + README + 2 min demo video |

**Start with Day 1 right now.** Any error → paste it here and I fix it immediately.