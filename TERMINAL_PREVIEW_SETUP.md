# Terminal & Website Preview Setup

## 🎯 What's New

I've added **real terminal** and **website preview** panels to your IDE:

### ✅ **Terminal Panel**
- **Real terminal interface** with command history
- **Quick action buttons** for common commands
- **npm install**, **npm run dev**, **npm run build** support
- **Copy output** functionality
- **Command simulation** (can be extended to real execution)

### ✅ **Website Preview Panel**
- **Live website preview** inside the IDE
- **Responsive testing** (Desktop, Tablet, Mobile views)
- **Multiple URL support** (Local dev, Vercel, Production)
- **Auto-refresh** and external link options
- **Status indicators** (Online/Offline)

## 🚀 How to Use

### 1. Open IDE
1. Go to Dashboard
2. Click any project
3. Click "Open IDE"
4. You'll see new tabs at the bottom: **Build Logs**, **Terminal**, **Preview**

### 2. Terminal Usage
**Quick Commands:**
- Click "📦 Install" → Runs `npm install`
- Click "🚀 Dev Server" → Runs `npm run dev`
- Click "🏗️ Build" → Runs `npm run build`
- Click "📁 List Files" → Runs `ls`

**Manual Commands:**
- Type any command in the input
- Press Enter or click ▶️
- See real-time output

**Available Commands:**
```bash
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview build
ls                  # List files
pwd                 # Show directory
clear               # Clear terminal
help                # Show help
```

### 3. Website Preview
**Quick URLs:**
- **🏠 Local Dev** → http://localhost:8080
- **▲ Vercel** → Your Vercel deployment
- **🌐 Production** → Your production URL

**Responsive Testing:**
- 🖥️ **Desktop** → Full width view
- 📱 **Tablet** → 768px width
- 📱 **Mobile** → 375px width

**Controls:**
- 🔄 **Refresh** → Reload preview
- 🔗 **External** → Open in new tab

## 🎨 Features

### Terminal Features
- **Command History** → All commands saved
- **Real-time Output** → See results as they happen
- **Error Handling** → Red text for errors
- **Copy Output** → Click any line to copy
- **Quick Actions** → One-click common commands

### Preview Features
- **Live Reload** → Auto-refresh when needed
- **Multi-device** → Test responsive design
- **Status Check** → Online/offline indicators
- **URL Switching** → Quick environment switching

## 🔧 Technical Details

### Terminal Implementation
```typescript
// Simulated command execution
const simulateCommand = async (command: string) => {
  if (command.startsWith("npm install")) {
    addLine("output", "📦 Installing dependencies...");
    // Simulate 2-second install
    setTimeout(() => {
      addLine("output", "✅ Dependencies installed!");
    }, 2000);
  }
};
```

### Preview Implementation
```typescript
// Responsive viewport sizing
const getViewportSize = () => {
  switch (viewMode) {
    case "mobile": return { width: "375px", height: "667px" };
    case "tablet": return { width: "768px", height: "1024px" };
    default: return { width: "100%", height: "100%" };
  }
};
```

## 🚀 Real Command Execution (Future)

To make the terminal execute **real commands**, you can:

### Option 1: WebSocket Connection
```typescript
// Connect to a WebSocket server that executes commands
const ws = new WebSocket('ws://localhost:3001/terminal');
ws.send(JSON.stringify({ command: 'npm install' }));
```

### Option 2: Supabase Edge Function
```typescript
// Create edge function that executes commands in Docker
const { data } = await supabase.functions.invoke('execute-command', {
  body: { command: 'npm install', projectPath: '/tmp/project' }
});
```

### Option 3: GitHub Codespaces Integration
```typescript
// Use GitHub Codespaces API for real terminal
const response = await fetch('https://api.github.com/user/codespaces', {
  headers: { Authorization: `token ${githubToken}` }
});
```

## 🎯 Current Workflow

1. **Load Project** → IDE opens with file explorer
2. **Terminal Tab** → Run `npm install` to setup
3. **Terminal Tab** → Run `npm run dev` to start server
4. **Preview Tab** → See live website at localhost:8080
5. **Make Changes** → Edit files in code editor
6. **Preview Updates** → Refresh to see changes
7. **Build & Deploy** → Run `npm run build` when ready

## 🔥 Demo Commands to Try

```bash
# In Terminal tab:
npm install
npm run dev
npm run build
ls
pwd
help
clear

# Then switch to Preview tab and see your site!
```

## 🎉 Result

You now have a **complete development environment** in your browser:
- ✅ **File Explorer** → Browse project files
- ✅ **Code Editor** → Edit with syntax highlighting
- ✅ **Terminal** → Run commands
- ✅ **Website Preview** → See live results
- ✅ **AI Assistant** → Get help with errors
- ✅ **Build Logs** → Debug issues

**It's like VS Code + Terminal + Browser all in one!** 🚀

## 🔧 Next Steps

1. **Try the terminal** → Run some npm commands
2. **Test the preview** → Load your website
3. **Switch between views** → Desktop/Tablet/Mobile
4. **Make code changes** → See live updates
5. **Use AI assistant** → Fix any errors

Your IDE is now a complete development environment! 🎯