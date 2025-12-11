@echo off
echo 🚀 Deploying ResurrectCI Edge Functions...

echo 📦 Deploying auto-fix-agent...
supabase functions deploy auto-fix-agent

echo 📦 Deploying ai-agent...
supabase functions deploy ai-agent

echo 📦 Deploying github-api...
supabase functions deploy github-api

echo 📦 Deploying vercel-api...
supabase functions deploy vercel-api

echo 📦 Deploying webhook-handler...
supabase functions deploy webhook-handler

echo.
echo 🔑 Setting up secrets...
echo Please run these commands with your actual API keys:
echo.
echo supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
echo supabase secrets set GITHUB_TOKEN=your_github_token_here
echo supabase secrets set VERCEL_TOKEN=your_vercel_token_here
echo.
echo ✅ Deployment complete!
echo.
echo 🎯 How it works now:
echo 1. Click 'Auto Fix' on any crashed project
echo 2. System fetches real Vercel build logs
echo 3. Gemini AI analyzes errors and generates fixes
echo 4. You see a diff preview of all changes
echo 5. Click 'Create PR' to apply the fixes
echo.
echo 🔥 No more manual chatting - fully automated!
pause