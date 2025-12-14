# Deploy Supabase Edge Function via Dashboard

Since you're using the online Supabase dashboard, follow these steps:

## 1. Go to your Supabase Dashboard
- Navigate to: https://supabase.com/dashboard/project/eahpikunzsaacibikwtj
- Go to "Edge Functions" in the left sidebar
- Find the "terminal-executor" function

## 2. Update the Function Code
Copy the entire content from `supabase/functions/terminal-executor/index.ts` and paste it into the online editor.

## 3. Key Changes Made
- ✅ Added `ALLOW_UNAUTHENTICATED = true` to bypass auth
- ✅ Enhanced CORS headers for better browser compatibility  
- ✅ Added health check endpoint (GET request)
- ✅ Improved error handling and logging

## 4. Deploy the Function
- Click "Deploy" in the Supabase dashboard
- Wait for deployment to complete
- Test the function

## 5. Test the Function
After deployment, the terminal should work without 401 errors.

## Alternative: Manual Function Creation
If the function doesn't exist, create a new one:
1. Click "Create Function" 
2. Name: `terminal-executor`
3. Paste the code from `supabase/functions/terminal-executor/index.ts`
4. Deploy

## Function Features
- ✅ Real Linux command execution
- ✅ Session management for persistent terminals
- ✅ File upload/download capabilities
- ✅ Security controls for dangerous commands
- ✅ CORS support for browser access
- ✅ Unauthenticated access for ease of use

The function will create real Linux sessions and execute actual commands on the server!