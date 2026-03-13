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

  } catch (error) {
    console.error('Error creating PR:', error)
    await sb.from('build_incidents').update({ status: 'failed' }).eq('id', incident_id)
  }

  return new Response('ok')
})
