# AI Code Analysis & Automation - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Connect Gemini API (1 minute)
1. Open **Settings** → **Integrations** → **Gemini**
2. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Paste the key into the input field
4. Click **Connect**
5. You should see "Connected to Gemini" status

### Step 2: Open DevOps Panel (30 seconds)
1. Click the **DevOps Center** button in your dashboard
2. Navigate to the **Automation** tab

### Step 3: Select Projects (1 minute)
1. In the **Project Selection** card:
   - Select a **GitHub Repository** from the dropdown
   - Select a **Vercel Project** from the dropdown
2. Both projects should now be linked

### Step 4: Analyze Code (2 minutes)
1. Click the **Analyze Code** button
2. Watch the progress bar as the system:
   - Fetches code files from GitHub (20%)
   - Analyzes with Gemini AI (40%)
   - Generates results (80-100%)
3. View the **Analysis Results** card showing:
   - Total issues found
   - Issues by priority (Critical, High, Medium, Low)
   - Files with issues and suggestions

### Step 5: Push Improvements (1 minute)
1. Review the analysis results
2. Click **Push to GitHub** to:
   - Create a new branch with improvements
   - Commit the analysis summary
   - Create a pull request
3. Click the PR link to review on GitHub

## 📊 Understanding Analysis Results

### Priority Levels
- **🔴 Critical**: Must fix immediately (security, crashes)
- **🟠 High**: Should fix soon (performance, bugs)
- **🟡 Medium**: Nice to have (code quality, style)
- **🔵 Low**: Optional improvements (minor optimizations)

### What Gets Analyzed
- Code structure and organization
- Performance issues
- Security vulnerabilities
- Best practices violations
- Code style and consistency
- Error handling
- Documentation

## 🔧 Troubleshooting

### "Gemini Not Connected"
- Go to Settings → Integrations → Gemini
- Verify your API key is valid
- Check that you have API quota remaining
- Try disconnecting and reconnecting

### "No GitHub Repositories Found"
- Ensure your GitHub token is connected in Settings → Integrations → GitHub
- Check that you have access to the repositories
- Click the refresh button to reload repositories

### "Analysis Failed"
- Check your internet connection
- Verify Gemini API key is still valid
- Try analyzing a smaller repository first
- Check browser console for error details

### "Push to GitHub Failed"
- Ensure GitHub token is still valid
- Check repository permissions
- Verify the branch doesn't already exist
- Try again in a few moments

## 💡 Tips & Best Practices

### For Best Results
1. **Start Small**: Analyze smaller repositories first
2. **Review Carefully**: Always review suggestions before applying
3. **Test Changes**: Test improvements in a development environment
4. **Iterate**: Run analysis multiple times to catch more issues
5. **Share Feedback**: Let us know what works and what doesn't

### Workflow Recommendations
1. Analyze your main branch regularly
2. Review pull requests created by the automation
3. Merge improvements that make sense
4. Skip improvements that don't fit your project
5. Adjust your code style based on suggestions

### Cost Optimization
- Gemini API has free tier with rate limits
- Analyze during off-peak hours if possible
- Start with smaller files to test
- Monitor your API usage in Google AI Studio

## 🎯 Common Use Cases

### Case 1: Code Quality Improvement
1. Select your main project
2. Run analysis
3. Review suggestions
4. Push improvements to a feature branch
5. Create PR for team review

### Case 2: Security Audit
1. Analyze your project
2. Focus on Critical and High priority issues
3. Review security-related suggestions
4. Push security fixes immediately
5. Monitor for new vulnerabilities

### Case 3: Performance Optimization
1. Analyze performance-critical files
2. Review High and Medium priority suggestions
3. Benchmark before and after changes
4. Push optimizations to staging
5. Test thoroughly before production

### Case 4: Onboarding New Developers
1. Run analysis on your codebase
2. Share results with new team members
3. Use suggestions as learning material
4. Discuss improvements as a team
5. Implement agreed-upon changes

## 📱 Mobile Usage

The AI Automation feature is fully mobile responsive:
- All buttons and inputs work on mobile
- Dropdowns are touch-friendly
- Progress bars are visible on small screens
- Results display properly on mobile
- Swipe to navigate between tabs

## 🔐 Security & Privacy

### Your Data
- API keys are encrypted in localStorage
- Keys are never logged or displayed
- Analysis results are stored locally
- No data is sent to third parties
- You control all GitHub access

### API Keys
- Keep your Gemini API key private
- Don't share your API key with others
- Rotate keys regularly
- Monitor API usage in Google AI Studio
- Disable keys when not in use

## 📞 Support

### Getting Help
1. Check this guide first
2. Review error messages carefully
3. Check browser console for details
4. Try the troubleshooting section
5. Contact support with error details

### Reporting Issues
- Include error message
- Describe what you were doing
- Share browser console logs
- Mention repository size
- Include API key status (not the key itself)

## 🎓 Learning More

### Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Vercel API Docs](https://vercel.com/docs/api)

### Examples
- Check the specification files in `.kiro/specs/ai-code-analysis-automation/`
- Review the component code for implementation details
- Look at the services for API integration patterns

## ✅ Checklist Before First Use

- [ ] Gemini API key obtained from Google AI Studio
- [ ] GitHub account connected in Settings
- [ ] Vercel account connected in Settings
- [ ] At least one GitHub repository available
- [ ] At least one Vercel project available
- [ ] Internet connection is stable
- [ ] Browser console is open for debugging (optional)

## 🚀 Next Steps

1. **Try It Out**: Run your first analysis
2. **Review Results**: Understand the suggestions
3. **Push Changes**: Create your first PR
4. **Iterate**: Run analysis regularly
5. **Optimize**: Adjust settings based on results

---

**Happy analyzing! 🎉**

For more information, see `AI_AUTOMATION_PHASE1_INTEGRATION_COMPLETE.md`
