# Live Preview Troubleshooting Guide

## Issue Fixed ✅

The live preview integration has been updated to fix the display issues. Here's what was changed:

### Changes Made:
1. **Fixed Server Detection**: Improved localhost detection logic
2. **Better URL Handling**: Properly sync URL changes with iframe
3. **Enhanced Error Handling**: Added better debugging and error recovery
4. **Iframe Improvements**: Added proper sandbox attributes and loading states

### Testing Steps:

1. **Start Your Dev Server**:
   ```bash
   npm run dev
   ```
   
2. **Open Preview Panel**:
   - Press `Ctrl+Shift+P` OR
   - Click the "Preview" button in the top menu bar
   
3. **Verify URL**:
   - Check that the URL bar shows: `http://localhost:5173`
   - If different port, update the URL manually
   
4. **Manual Test**:
   - Try opening `http://localhost:5173` in a new browser tab
   - If it works there, it should work in the preview panel

### Common Issues & Solutions:

#### 1. Preview Panel Shows "Development Server Not Running"
- **Solution**: The server detection was fixed to assume localhost is online
- **Action**: Refresh the preview panel or restart the IDE

#### 2. Iframe Shows Blank/White Screen
- **Possible Causes**:
  - CORS issues (should be fixed with sandbox attributes)
  - Wrong URL/port
  - Dev server not actually running
- **Solutions**:
  - Check browser console for errors
  - Verify dev server is running in terminal
  - Try refreshing the preview (refresh button)
  - Try opening in new tab to verify URL works

#### 3. Wrong Port/URL
- **Solution**: 
  - Update URL in preview panel address bar
  - Common ports: 3000 (React), 5173 (Vite), 8080 (Webpack)

### Debug Information:

The preview panel now shows:
- ✅ Current URL being loaded
- ✅ Online/offline status indicator  
- ✅ Debug overlay showing loading URL
- ✅ Console logs for successful loads
- ✅ Better error handling

### Quick Test Commands:

```bash
# Test if your dev server is accessible
curl http://localhost:5173

# Or open in browser
start http://localhost:5173  # Windows
open http://localhost:5173   # Mac
```

### Expected Behavior:

1. Run `npm run dev` in terminal
2. Terminal shows: "🚀 Development server started! Preview opened at http://localhost:5173"
3. Preview panel opens automatically
4. Website content appears in the iframe
5. Can switch between desktop/tablet/mobile views
6. Can refresh and interact with the preview

If you're still having issues, check the browser console (F12) for any error messages and let me know what you see!