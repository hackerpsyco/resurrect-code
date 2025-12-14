import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Handle GET requests for health check
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Simple Real Terminal is running!',
          timestamp: new Date().toISOString(),
          realExecution: true,
          unauthenticated: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const body = await req.json()
    const { command, projectPath, owner, repo } = body

    console.log(`Executing command: ${command}`)

    // Validate command exists
    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          output: 'Command is required',
          error: 'Invalid command parameter'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Execute REAL command using Deno
    let output = '';
    let success = true;
    let exitCode = 0;

    try {
      // Create working directory
      const workingDir = `/tmp/project_${Date.now()}`;
      await Deno.mkdir(workingDir, { recursive: true });

      // Execute the REAL command
      const process = new Deno.Command("sh", {
        args: ["-c", command],
        cwd: workingDir,
        stdout: "piped",
        stderr: "piped",
        env: {
          PATH: "/usr/local/bin:/usr/bin:/bin",
          HOME: workingDir,
        }
      });

      const { code, stdout, stderr } = await process.output();
      
      output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);
      
      if (error && !output) {
        output = error;
        success = false;
      }
      
      exitCode = code;

      console.log(`Command executed: ${command}, Exit code: ${code}`);

    } catch (error) {
      console.error('Command execution failed:', error);
      output = `Error executing command: ${error.message}`;
      success = false;
      exitCode = 1;
    }

    const response = {
      success,
      output: output || `Command executed: ${command}`,
      exitCode,
      realExecution: true,
      timestamp: new Date().toISOString(),
      projectPath: projectPath || 'unknown'
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Request error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        output: `Error: ${error.message}`,
        error: 'Request processing failed',
        realExecution: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})