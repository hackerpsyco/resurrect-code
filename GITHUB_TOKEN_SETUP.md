# 🔑 GitHub Token Setup Guide

## 🚨 **Issue: Rate Limit Exceeded (403 Forbidden)**

The 403 error means GitHub is limiting API requests because you're not authenticated. Here's how to fix it:

## 🔧 **Quick Fix - Add GitHub Token**

### **Step 1: Create GitHub Token**
1. **Go to**: https://github.com/settings/tokens/new
2. **Token name**: `ResurrectCI IDE`
3. **Expiration**: `90 days` (or your preference)
4. **Select scopes**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Read user profile data)
5. **Click "Generate token"**
6. **Copy the token** (starts with `ghp_`)

### **Step 2: Add Token to Your App**
1. **Open your dashboard**
2. **Click "Connect GitHub" or "Browse GitHub Repos"**
3. **Paste your token** in the GitHub token field
4. **Click "Connect GitHub"**

### **Step 3: Test the Integration**
1. **Your repositories will now load** without rate limits
2. **You can access private repositories**
3. **Higher API rate limits** (5,000 requests/hour vs 60)

## 🎯 **Alternative: Use Public Repositories Only**

If you don't want to create a token, you can still use public repositories:

### **Working Public Repositories:**
- `microsoft/vscode` ✅
- `vercel/next.js` ✅
- `facebook/react` ✅
- `nodejs/node` ✅

### **How to Use Without Token:**
1. **Go to**: `http://localhost:5173/github-ide`
2. **Enter a public repository**:
   - Owner: `microsoft`
   - Repository: `vscode`
3. **Click "Open in Code Editor"**

## 🔍 **Why You Need a Token:**

| Without Token | With Token |
|---------------|------------|
| 60 requests/hour | 5,000 requests/hour |
| Public repos only | Public + Private repos |
| Rate limited quickly | Much higher limits |
| 403 errors common | Reliable access |

## 🚀 **Recommended Solution:**

**Create a GitHub token** - it takes 2 minutes and gives you full access to all your repositories with high rate limits.

**Token URL**: https://github.com/settings/tokens/new?scopes=repo,user&description=ResurrectCI%20IDE