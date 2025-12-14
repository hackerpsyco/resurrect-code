import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Allow unauthenticated access for terminal operations
const ALLOW_UNAUTHENTICATED = true

interface TerminalRequest {
  // New real execution fields
  action?: 'create_session' | 'execute_command' | 'upload_files' | 'destroy_session';
  sessionId?: string;
  files?: Record<string, string>;
  cwd?: string;
  
  // Legacy fields for backward compatibility
  command: string;
  projectPath?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}

// Store active terminal sessions for real execution
const sessions = new Map<string, {
  id: string;
  projectPath: string;
  workingDir: string;
  createdAt: Date;
  lastActivity: Date;
}>()

// Store running processes
const runningProcesses = new Map<string, Deno.ChildProcess>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details for debugging
    console.log('📡 Terminal request received:', {
      method: req.method,
      url: req.url,
      origin: req.headers.get('origin'),
      userAgent: req.headers.get('user-agent')
    });

    // Handle GET requests for health check
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Real Terminal Executor is running!',
          timestamp: new Date().toISOString(),
          realExecution: true,
          unauthenticated: ALLOW_UNAUTHENTICATED
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Skip authentication check if allowed
    if (!ALLOW_UNAUTHENTICATED) {
      // Add authentication logic here if needed
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required',
            message: 'Missing authorization header'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        )
      }
    }

    const body: TerminalRequest = await req.json()
    const { action, sessionId, command, projectPath, owner, repo, branch, files, cwd } = body

    console.log(`Terminal request - Action: ${action || 'legacy'}, Command: ${command}`)
    
    // Handle new real execution actions
    if (action) {
      switch (action) {
        case 'create_session':
          return await createRealSession(sessionId!, projectPath || `${owner}/${repo}`)
        
        case 'execute_command':
          return await executeRealCommand(sessionId!, command, cwd)
        
        case 'upload_files':
          return await uploadProjectFiles(sessionId!, files!, projectPath!)
        
        case 'destroy_session':
          return await destroyRealSession(sessionId!)
        
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    }

    // Legacy simulated execution for backward compatibility
    console.log(`Legacy execution - Project: ${owner}/${repo}`)

    // Validate command exists for legacy mode
    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          output: 'Command is required for legacy mode',
          error: 'Invalid command parameter'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // For security, we'll only allow specific safe commands
    const allowedCommands = [
      'npm install',
      'npm run dev',
      'npm run build',
      'npm start',
      'yarn install',
      'yarn dev',
      'yarn build',
      'yarn start',
      'ls',
      'pwd',
      'git status',
      'git log --oneline -5',
      'node --version',
      'npm --version'
    ];

    const isAllowed = allowedCommands.some(allowed => 
      command.toLowerCase().startsWith(allowed.toLowerCase())
    );

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          output: `Command not allowed: ${command}`,
          error: 'Security: Only specific commands are allowed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Create a temporary project directory (in a real implementation)
    const tempProjectPath = `/tmp/projects/${owner}-${repo}`;
    
    // Simulate command execution with realistic responses
    let output = '';
    let success = true;
    let devServerUrl = '';

    const cmd = (command || '').toLowerCase().trim();

    if (cmd.includes('npm install') || cmd.includes('yarn install')) {
      // Simulate npm install
      output = `📦 Installing dependencies for ${owner}/${repo}...\n`;
      output += `⬇️  Downloading packages...\n`;
      output += `✅ Dependencies installed successfully!\n`;
      output += `📊 Added 396 packages in 23.4s\n`;
      output += `💡 Run 'npm run dev' to start development server`;
      
    } else if (cmd.includes('npm run dev') || cmd.includes('yarn dev') || cmd.includes('npm start')) {
      // Simulate dev server start
      output = `🚀 Starting development server for ${owner}/${repo}...\n`;
      output += `📁 Project directory: ${tempProjectPath}\n`;
      
      // Determine server type and port
      if (cmd.includes('next') || repo?.includes('next')) {
        devServerUrl = 'http://localhost:3000';
        output += `✅ Next.js development server ready!\n`;
        output += `🌐 Local:   http://localhost:3000/\n`;
      } else if (cmd.includes('angular') || repo?.includes('angular')) {
        devServerUrl = 'http://localhost:4200';
        output += `✅ Angular development server ready!\n`;
        output += `🌐 Local:   http://localhost:4200/\n`;
      } else if (cmd.includes('vue') || repo?.includes('vue')) {
        devServerUrl = 'http://localhost:8080';
        output += `✅ Vue.js development server ready!\n`;
        output += `🌐 Local:   http://localhost:8080/\n`;
      } else {
        devServerUrl = 'http://localhost:5173';
        output += `✅ Vite development server ready!\n`;
        output += `🌐 Local:   http://localhost:5173/\n`;
      }
      
      output += `📱 Network: use --host to expose\n`;
      output += `🔥 Hot Module Replacement enabled\n`;
      output += `\n🎉 Development server is running!\n`;
      output += `💡 Open ${devServerUrl} in your browser`;
      
    } else if (cmd.includes('npm run build') || cmd.includes('yarn build')) {
      output = `🏗️  Building ${owner}/${repo} for production...\n`;
      output += `📦 Bundling assets...\n`;
      output += `✅ Build completed successfully!\n`;
      output += `📊 Output: dist/ (2.3 MB)\n`;
      output += `🚀 Ready for deployment!`;
      
    } else if (cmd === 'ls' || cmd === 'dir') {
      output = `📁 Contents of ${tempProjectPath}:\n`;
      output += `📁 node_modules/\n`;
      output += `📁 public/\n`;
      output += `📁 src/\n`;
      output += `📄 .gitignore\n`;
      output += `📄 package.json\n`;
      output += `📄 README.md\n`;
      output += `📄 vite.config.ts`;
      
    } else if (cmd === 'pwd') {
      output = tempProjectPath;
      
    } else if (cmd.includes('git status')) {
      output = `On branch ${branch || 'main'}\n`;
      output += `Your branch is up to date with 'origin/${branch || 'main'}'.\n`;
      output += `\nnothing to commit, working tree clean`;
      
    } else if (cmd.includes('git log')) {
      output = `a1b2c3d (HEAD -> ${branch || 'main'}) Latest commit\n`;
      output += `d4e5f6g Add new features\n`;
      output += `g7h8i9j Fix bugs\n`;
      output += `j1k2l3m Initial commit`;
      
    } else if (cmd.includes('--version')) {
      if (cmd.includes('node')) {
        output = 'v18.17.0';
      } else if (cmd.includes('npm')) {
        output = '9.6.7';
      } else {
        output = 'Version information not available';
      }
      
    } else {
      output = `Command executed: ${command}\n`;
      output += `Project: ${owner}/${repo}\n`;
      output += `Directory: ${tempProjectPath}`;
    }

    const response = {
      success,
      output,
      devServerUrl: devServerUrl || undefined,
      projectPath: tempProjectPath,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Terminal execution error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'Terminal execution failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// REAL EXECUTION FUNCTIONS

async function createRealSession(sessionId: string, projectPath: string) {
  try {
    // Create a unique working directory for this session
    const workingDir = `/tmp/terminal_${sessionId}`
    
    // Create the working directory
    await Deno.mkdir(workingDir, { recursive: true })
    
    // Initialize with basic project structure
    await Deno.writeTextFile(`${workingDir}/README.md`, `# Real Terminal Session ${sessionId}\n\nProject: ${projectPath}\nCreated: ${new Date().toISOString()}\n`)
    
    // Store session info
    sessions.set(sessionId, {
      id: sessionId,
      projectPath,
      workingDir,
      createdAt: new Date(),
      lastActivity: new Date()
    })
    
    console.log('✅ Created REAL terminal session:', sessionId, 'at', workingDir)
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        workingDir,
        message: 'Real terminal session created successfully',
        realExecution: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Failed to create real session:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        realExecution: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

async function executeRealCommand(sessionId: string, command: string, cwd?: string) {
  const session = sessions.get(sessionId)
  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Terminal session not found',
        output: '',
        exitCode: 1
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
  
  // Update last activity
  session.lastActivity = new Date()
  
  const workingDirectory = cwd || session.workingDir
  
  console.log('🔄 Executing REAL command:', command, 'in', workingDirectory)
  
  try {
    // Handle special commands
    if (command.trim() === 'pwd') {
      return new Response(
        JSON.stringify({
          success: true,
          output: workingDirectory,
          error: '',
          exitCode: 0,
          realExecution: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    
    // Security: Allow more commands for real execution but still be safe
    const dangerousCommands = ['rm -rf /', 'sudo', 'su', 'chmod 777', 'dd if=', 'mkfs', 'fdisk']
    const isDangerous = dangerousCommands.some(dangerous => 
      (command || '').toLowerCase().includes(dangerous.toLowerCase())
    )
    
    if (isDangerous) {
      return new Response(
        JSON.stringify({
          success: false,
          output: '',
          error: 'Dangerous command blocked for security',
          exitCode: 1,
          realExecution: true
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    
    // Execute the REAL command
    const process = new Deno.Command("sh", {
      args: ["-c", command],
      cwd: workingDirectory,
      stdout: "piped",
      stderr: "piped",
      env: {
        ...Deno.env.toObject(),
        PATH: "/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/local/node/bin",
        NODE_ENV: "development",
        HOME: workingDirectory,
        // Add Node.js to PATH if available
        NODE_PATH: "/usr/local/lib/node_modules"
      }
    })
    
    const { code, stdout, stderr } = await process.output()
    
    const output = new TextDecoder().decode(stdout)
    const error = new TextDecoder().decode(stderr)
    
    console.log('✅ REAL command executed:', {
      command,
      exitCode: code,
      outputLength: output.length,
      errorLength: error.length
    })
    
    return new Response(
      JSON.stringify({
        success: code === 0,
        output,
        error,
        exitCode: code,
        isRunning: false,
        realExecution: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ REAL command execution failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        output: '',
        error: error.message,
        exitCode: 1,
        isRunning: false,
        realExecution: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

async function uploadProjectFiles(sessionId: string, files: Record<string, string>, projectPath: string) {
  const session = sessions.get(sessionId)
  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Terminal session not found'
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
  
  console.log(`📁 Uploading ${Object.keys(files).length} REAL files to session ${sessionId}`)
  
  try {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = `${session.workingDir}/${filePath}`
      
      // Create directory if needed
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
      if (dir !== session.workingDir) {
        await Deno.mkdir(dir, { recursive: true })
      }
      
      // Write REAL file content
      await Deno.writeTextFile(fullPath, content)
      console.log('📝 Uploaded REAL file:', filePath)
    }
    
    // Update session activity
    session.lastActivity = new Date()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Uploaded ${Object.keys(files).length} files to real file system`,
        realExecution: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ REAL file upload failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        realExecution: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

async function destroyRealSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session not found (already destroyed?)',
        realExecution: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
  
  try {
    // Kill any running processes for this session
    const processKey = `${sessionId}_process`
    const runningProcess = runningProcesses.get(processKey)
    if (runningProcess) {
      runningProcess.kill()
      runningProcesses.delete(processKey)
    }
    
    // Clean up REAL working directory
    try {
      await Deno.remove(session.workingDir, { recursive: true })
    } catch (error) {
      console.warn('Failed to remove real working directory:', error.message)
    }
    
    // Remove session
    sessions.delete(sessionId)
    
    console.log('🗑️ Destroyed REAL terminal session:', sessionId)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Real session destroyed successfully',
        realExecution: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Failed to destroy real session:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        realExecution: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Cleanup old sessions periodically
setInterval(() => {
  const now = new Date()
  const maxAge = 30 * 60 * 1000 // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > maxAge) {
      console.log('🧹 Cleaning up inactive REAL session:', sessionId)
      destroyRealSession(sessionId)
    }
  }
}, 5 * 60 * 1000) // Check every 5 minutes