@echo off
echo 🚀 Deploying True Real Terminal Backend...
echo.

echo 📋 Checking Supabase CLI...
supabase --version
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found!
    echo 💡 Install it with: npm install -g supabase
    echo 🔗 Or visit: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo ✅ Supabase CLI found!
echo.

echo 🔐 Checking Supabase login...
supabase projects list
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Supabase!
    echo 💡 Login with: supabase login
    pause
    exit /b 1
)

echo ✅ Supabase login verified!
echo.

echo 🚀 Deploying terminal-executor function...
supabase functions deploy terminal-executor

if %errorlevel% eq 0 (
    echo.
    echo ✅ Terminal executor deployed successfully!
    echo 🎉 Your True Real Terminal is now ready!
    echo.
    echo 📋 Next steps:
    echo 1. Open your IDE
    echo 2. Load a GitHub repository
    echo 3. Open terminal (should show "True Real Terminal")
    echo 4. Run: npm install
    echo 5. Run: npm run dev
    echo 6. Watch real development server start!
    echo.
) else (
    echo.
    echo ❌ Deployment failed!
    echo 💡 Check the error messages above
    echo 🔧 Make sure you're in the correct project directory
    echo.
)

pause