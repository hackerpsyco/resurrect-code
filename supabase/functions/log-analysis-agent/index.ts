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
