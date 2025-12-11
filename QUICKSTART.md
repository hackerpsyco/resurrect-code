# ResurrectCI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create `.env` file:
```env
VITE_SUPABASE_URL=https://eahpikunzsaacibikwtj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Start Development Server
```bash
npm run dev
```

Visit `http://localhost:8080`

### Step 4: Configure AI Provider

#### Option A: Quick Setup with Gemini (Free)
1. Get free API key: https://makersuite.google.com/app/apikey
2. Open any project in IDE
3. Click "AI Settings" in Cline panel
4. Select "Google Gemini"
5. Choose "gemini-2.0-flash-exp"
6. Paste API key
7. Save

#### Option B: Use Lovable AI Gateway (No API Key)
1. Deploy Supabase function:
   ```bash
   supabase functions deploy ai-chat-stream
   ```
2. Set Lovable API key:
   ```bash
   supabase secrets set LOVABLE_API_KEY=your_key
   ```
3. Select "Lovable AI Gateway" in settings
4. Done!

### Step 5: Connect a Project
1. Click "Connect Project" on dashboard
2. Enter GitHub repository URL
3. (Optional) Connect Vercel project
4. Click "Connect"

### Step 6: Try the AI IDE
1. Click on a project card
2. Click "Open IDE"
3. Ask Cline AI: "Explain this project structure"
4. Watch the streaming response!

## 🎯 Common Tasks

### Fix a Build Error
```
1. Project shows "crashed" status
2. Click "Auto Fix" button
3. Review proposed changes in diff view
4. Click "Create Pull Request"
5. Done!
```

### Chat with AI
```
1. Open IDE
2. Type in Cline panel: "Add error handling to this file"
3. AI streams response with code
4. Click "Apply" on code blocks
5. Review diff
6. Save changes
```

### Create a PR
```
1. Make changes in editor
2. Modified files show dot indicator
3. Click "Create PR" in header
4. PR created automatically
5. Review on GitHub
```

## 📚 Learn More

- [Full Cline AI Setup Guide](./CLINE_AI_SETUP.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Main README](./README.md)

## 🐛 Troubleshooting

### "Please configure AI provider first"
→ Click Settings icon in Cline panel and add API key

### CORS errors
→ Deploy Supabase functions: `supabase functions deploy`

### Build errors
→ Run `npm install` and check Node version (16+)

### AI not responding
→ Check API key is valid and has credits

## 💡 Pro Tips

1. **Use Quick Actions** - Fastest way to get started
2. **Review Diffs** - Always check changes before applying
3. **Save Often** - Commit changes frequently
4. **Try Different Models** - Each has strengths
5. **Provide Context** - Open relevant files first

## 🎉 You're Ready!

Start fixing build errors with AI assistance. Happy coding! 🚀
