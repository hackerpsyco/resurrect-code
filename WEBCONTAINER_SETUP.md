# WebContainer Integration Setup Guide

## 🚀 What You Now Have

I've successfully integrated WebContainer (StackBlitz's browser-based Node.js runtime) into your IDE. Here's what's been added:

### 1. Core Components Created

- **WebContainerContext** (`src/contexts/WebContainerContext.tsx`) - Singleton WebContainer provider
- **WebContainerTerminal** (`src/components/ide/WebContainerTerminal.tsx`) - Real terminal with xterm.js
- **WebContainerPreview** (`src/components/ide/WebContainerPreview.tsx`) - Live preview with auto-refresh
- **WebContainerCodeEditor** (`src/components/ide/WebContainerCodeEditor.tsx`) - Monaco editor with WebContainer integration
- **WebContainerDemo** (`src/components/ide/WebContainerDemo.tsx`) - Complete demo implementation

### 2. Integration Points

- **VSCodeInterface** - Added toggle button (🟢 Real / 🔴 Demo) to switch between WebContainer and simulated mode
- **App.tsx** - Added `/webcontainer-demo` route for standalone demo

## 🎯 How to Test

### Option 1: Standalone Demo
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/webcontainer-demo`
3. You'll see a complete IDE with:
   - Real Node.js terminal (try `node --version`)
   - Code editor with auto-save to WebContainer
   - Live preview that updates when you run `npm run dev`

### Option 2: Integrated Mode
1. Go to your existing IDE interface
2. Click the "🟢 Real" button in the header to enable WebContainer mode
3. The terminal and preview will now use real Node.js execution

## 🔧 Key Features

### Real Terminal
- **Actual Node.js execution** in browser
- **Real package management** (`npm install`, `yarn add`)
- **Live development servers** (`npm run dev`, `yarn start`)
- **File system operations** (`ls`, `pwd`, `mkdir`)

### Live Preview
- **Auto-detects server startup** and opens preview
- **Real-time updates** when you save files
- **Multiple device views** (desktop, tablet, mobile)
- **Direct iframe integration** with running servers

### Code Editor
- **Auto-saves to WebContainer** virtual file system
- **Real-time file synchronization**
- **Monaco editor** with full IntelliSense
- **Multi-file support** with tabs

## ⚠️ Important Requirements

### Cross-Origin Isolation
WebContainer requires these headers for security:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### For Vite Development
Add to your `vite.config.ts`:
```typescript
export default defineConfig({
  // ... existing config
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
```

### For Production Deployment
Add these headers to your web server configuration.

## 🧪 Testing the Integration

### 1. Basic Terminal Test
```bash
# In the WebContainer terminal:
node --version        # Should show real Node.js version
npm --version         # Should show real npm version
ls -la               # Should show actual file system
```

### 2. Package Installation Test
```bash
# Install a real package:
npm install lodash
node -e "console.log(require('lodash').version)"
```

### 3. Development Server Test
```bash
# Start the demo server:
npm run dev
# Preview should auto-open with live server
```

### 4. File System Test
```bash
# Create and run a file:
echo "console.log('Hello WebContainer!')" > test.js
node test.js
```

## 🔄 Integration with Your Existing Code

The WebContainer components are designed to be drop-in replacements:

### Replace Existing Terminal
```typescript
// Before:
<WebTerminal {...props} />

// After:
<WebContainerTerminal {...props} />
```

### Replace Existing Preview
```typescript
// Before:
<LivePreview {...props} />

// After:
<WebContainerPreview {...props} />
```

### Use the Complete Integration
```typescript
<WebContainerIntegration
  activeFile={activeFile}
  fileContent={fileContent}
  showTerminal={showTerminal}
  showPreview={showPreview}
  onDevServerStart={(url) => console.log('Server:', url)}
/>
```

## 🎨 Customization

### Styling
All components use your existing VS Code theme classes:
- `bg-[#1e1e1e]` - Dark background
- `text-[#cccccc]` - Light text
- `border-[#464647]` - Border colors

### Event Handling
Components emit events for:
- `onDevServerStart(url)` - When a server starts
- `onDevServerStop()` - When a server stops
- `onFileChange(content)` - When files are modified

## 🚀 Next Steps

1. **Test the demo**: Visit `/webcontainer-demo` to see it in action
2. **Enable in your IDE**: Click the "🟢 Real" toggle in your existing interface
3. **Add headers**: Configure cross-origin isolation for full functionality
4. **Customize**: Modify components to match your exact needs

## 🐛 Troubleshooting

### "WebContainer Not Supported" Error
- Ensure cross-origin isolation headers are set
- Check that `SharedArrayBuffer` is available
- Verify `crossOriginIsolated` is true in browser console

### Terminal Not Connecting
- Check browser console for WebContainer boot errors
- Ensure all dependencies are installed (`@webcontainer/api`, `@xterm/xterm`)
- Verify no conflicting terminal instances

### Preview Not Loading
- Check if development server actually started in terminal
- Verify port is not blocked by firewall
- Check browser console for iframe errors

## 📚 Resources

- [WebContainer API Docs](https://webcontainer.io/api)
- [xterm.js Documentation](https://xtermjs.org/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)

Your WebContainer integration is now ready! 🎉