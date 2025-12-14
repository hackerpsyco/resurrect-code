// Direct Supabase Function Deployment Script
// Run this to deploy the real terminal function

const SUPABASE_URL = 'https://eahpikunzsaacibikwtj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHBpa3VuenNhYWNpYmlrd3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDYzNjMsImV4cCI6MjA2MzU4MjM2M30.8XVM3S7qzHMxb6kL44O2C5vIcgMH2b-fPcCWIBlJawA';

async function testSupabaseFunction() {
    console.log('🔍 Testing Supabase function connection...');
    
    try {
        // Test current function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/terminal-executor`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Function is working!', result);
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Function error:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Connection error:', error);
        return false;
    }
}

async function testRealCommand() {
    console.log('🚀 Testing REAL command execution...');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/terminal-executor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command: 'echo "REAL EXECUTION TEST"',
                projectPath: 'test-project',
                owner: 'test',
                repo: 'project'
            })
        });
        
        const result = await response.json();
        console.log('Command result:', result);
        
        if (result.success && result.output) {
            console.log('✅ REAL execution working!');
            console.log('Output:', result.output);
            return true;
        } else {
            console.log('❌ Command failed:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Command error:', error);
        return false;
    }
}

async function testRealSession() {
    console.log('🔧 Testing REAL session creation...');
    
    const sessionId = `test_${Date.now()}`;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/terminal-executor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create_session',
                sessionId: sessionId,
                projectPath: 'test-project'
            })
        });
        
        const result = await response.json();
        console.log('Session result:', result);
        
        if (result.success) {
            console.log('✅ REAL session created!');
            console.log('Session ID:', sessionId);
            console.log('Working Dir:', result.workingDir);
            
            // Test command in session
            await testSessionCommand(sessionId);
            return true;
        } else {
            console.log('❌ Session creation failed:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Session error:', error);
        return false;
    }
}

async function testSessionCommand(sessionId) {
    console.log('⚡ Testing command in REAL session...');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/terminal-executor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'execute_command',
                sessionId: sessionId,
                command: 'pwd && whoami && uname -a'
            })
        });
        
        const result = await response.json();
        console.log('Session command result:', result);
        
        if (result.success) {
            console.log('✅ REAL session command executed!');
            console.log('Real output:', result.output);
        } else {
            console.log('❌ Session command failed:', result);
        }
    } catch (error) {
        console.error('❌ Session command error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Supabase Real Terminal Tests...\n');
    
    const healthOk = await testSupabaseFunction();
    console.log('\n' + '='.repeat(50) + '\n');
    
    if (healthOk) {
        const commandOk = await testRealCommand();
        console.log('\n' + '='.repeat(50) + '\n');
        
        const sessionOk = await testRealSession();
        console.log('\n' + '='.repeat(50) + '\n');
        
        if (commandOk || sessionOk) {
            console.log('🎉 SUCCESS! Your Supabase function supports REAL execution!');
            console.log('💡 The function is working - check your terminal component.');
        } else {
            console.log('❌ Function exists but REAL execution is not working.');
            console.log('📋 You need to deploy the updated function code.');
        }
    } else {
        console.log('❌ Function is not accessible or not deployed.');
        console.log('📋 You need to deploy the function first.');
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testSupabaseTerminal = runAllTests;
    console.log('💡 Run window.testSupabaseTerminal() in browser console to test');
}

// Run if in Node.js
if (typeof module !== 'undefined') {
    runAllTests();
}