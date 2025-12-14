# 🌐 Live Preview Integration

## ✅ **Live Website Preview Added!**

I've added a **live preview panel** to your code editor that shows your website running in real-time when you start the development server!

## 🚀 **How to Use Live Preview:**

### **🎯 Quick Start:**
1. **Open the GitHub IDE** (`/github-ide`)
2. **Load any repository** (e.g., hackerpsyco/resurrect-code)
3. **Click the "Preview" button** in the top bar
4. **Or press `Ctrl+Shift+P`** to toggle preview
5. **Run `npm run dev`** in the terminal
6. **Watch your website appear live** in the preview panel!

### **📱 Preview Features:**

#### **🖥️ Multi-Device View:**
- **Desktop View** - Full width preview
- **Tablet View** - 768px width simulation
- **Mobile View** - 320px width simulation
- **One-click switching** between device types

#### **🔧 Preview Controls:**
- **URL Bar** - Enter any localhost URL
- **Refresh Button** - Reload the preview
- **External Link** - Open in new browser tab
- **Maximize/Minimize** - Full screen preview
- **Device Selector** - Switch between screen sizes

#### **⚡ Smart Detection:**
- **Auto-detects** when dev server starts
- **Shows offline state** when server is down
- **Real-time status** indicator (online/offline)
- **Common port suggestions** (3000, 5173, 8080, etc.)

### **🎮 Layout Options:**

#### **Split View Modes:**
1. **Editor Only** - Full screen code editing
2. **Editor + Terminal** - Code with right-side terminal
3. **Editor + Preview** - Code with bottom preview panel
4. **Editor + Terminal + Preview** - Full development environment

#### **Toggle Controls:**
- **`Ctrl + `` ** - Toggle terminal
- **`Ctrl+Shift+P`** - Toggle preview
- **Top bar buttons** - Click to toggle panels

### **🔧 Development Workflow:**

#### **1. Start Development Server:**
```bash
# In the terminal
npm install
npm run dev
```

#### **2. Preview Automatically Updates:**
- **Live reload** when you save files
- **Hot module replacement** support
- **Real-time changes** reflected instantly

#### **3. Multi-Device Testing:**
- **Switch device views** to test responsiveness
- **See how your site looks** on different screen sizes
- **Test mobile-first** design approaches

### **🌐 Supported Development Servers:**

| Framework | Command | Default Port | Auto-Detected |
|-----------|---------|--------------|---------------|
| Vite | `npm run dev` | 5173 | ✅ |
| React | `npm start` | 3000 | ✅ |
| Next.js | `npm run dev` | 3000 | ✅ |
| Angular | `ng serve` | 4200 | ✅ |
| Vue.js | `npm run serve` | 8080 | ✅ |
| Webpack | `npm run dev` | 8080 | ✅ |

### **💡 Pro Tips:**

#### **🚀 Quick Development Setup:**
1. **Click "Run" button** in menu (starts terminal + preview)
2. **Type `npm run dev`** in terminal
3. **Preview automatically shows** your running app
4. **Make code changes** and see them live!

#### **📱 Responsive Design Testing:**
1. **Switch to mobile view** while developing
2. **Test different screen sizes** instantly
3. **Debug responsive layouts** in real-time
4. **Perfect for mobile-first** development

#### **🔧 Custom URLs:**
- **Enter any localhost URL** in the preview bar
- **Test different ports** easily
- **Switch between multiple** running servers
- **Preview external URLs** for comparison

### **⌨️ Keyboard Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Toggle preview panel |
| `Ctrl + `` | Toggle terminal |
| `Ctrl+S` | Save file (triggers live reload) |
| `Ctrl+R` | Refresh preview |
| `F5` | Run project (opens terminal + preview) |

### **🎨 Preview Panel Layout:**

```
┌─────────────────────────────────────────┐
│ [Globe] Live Preview [●] [URL Bar] [Go] │
│ [Desktop][Tablet][Mobile] [⟲][↗][□][×] │
├─────────────────────────────────────────┤
│                                         │
│        Your Website Preview            │
│         (Live Updates)                  │
│                                         │
├─────────────────────────────────────────┤
│ URL: localhost:5173 | Device: desktop  │
└─────────────────────────────────────────┘
```

## 🎯 **Complete Development Environment:**

Your code editor now provides:
- ✅ **Real GitHub integration** - Load actual repositories
- ✅ **Live terminal** - Run real commands
- ✅ **Live preview** - See your website running
- ✅ **Multi-device testing** - Desktop, tablet, mobile views
- ✅ **Hot reload** - Instant updates when you save
- ✅ **Full VS Code experience** - Professional IDE interface

**You now have a complete web development environment in your browser!** 🎉

## 🚀 **Try It Now:**

1. **Go to `/github-ide`**
2. **Load hackerpsyco/resurrect-code**
3. **Click "Preview" button**
4. **Run `npm run dev` in terminal**
5. **Watch your website come alive!**