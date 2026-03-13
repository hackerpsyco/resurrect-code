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
