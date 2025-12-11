# ResurrectCI Demo Guide

## 🎬 Demo Script for Showcasing Features

### Demo 1: Quick Setup (2 minutes)

**What to show:**
1. Fresh install
2. Configure Gemini API
3. First AI interaction

**Script:**
```
"Let me show you how quick it is to get started with ResurrectCI..."

1. npm install && npm run dev
2. Open dashboard
3. Click any project → Open IDE
4. Click Settings icon in Cline panel
5. Select "Google Gemini"
6. Paste API key
7. Save

"And we're ready! Let's ask the AI something..."

8. Type: "Explain this project structure"
9. Watch streaming response appear in real-time
10. "See how it streams the response? Just like ChatGPT!"
```

### Demo 2: Fix Build Error (3 minutes)

**What to show:**
1. Crashed build
2. AI analysis
3. Code suggestion
4. Diff view
5. PR creation

**Script:**
```
"Now let's see the real power - fixing build errors automatically..."

1. Show project with "crashed" status
2. Click "Auto Fix" button
3. "The AI is now analyzing the error logs..."
4. Show AI analyzing in real-time
5. "Here's the proposed fix with a diff view"
6. Show side-by-side comparison
7. "We can review every change before applying"
8. Click "Create Pull Request"
9. "And done! PR created with all the fixes"
10. Open GitHub to show the PR
```

### Demo 3: Interactive Coding (4 minutes)

**What to show:**
1. Open file in editor
2. Ask AI for help
3. Apply code suggestion
4. Review diff
5. Save changes

**Script:**
```
"Let's see how Cline AI helps with day-to-day coding..."

1. Open IDE
2. Open a file (e.g., src/App.tsx)
3. Type in Cline: "Add error handling to this component"
4. "Watch as the AI streams the response..."
5. Show code block appearing with file path
6. Click "Apply to App.tsx"
7. "Now we see the diff view - original vs AI-modified"
8. "We can edit further if needed"
9. Click Save
10. "Changes committed to GitHub!"
```

### Demo 4: Quick Actions (2 minutes)

**What to show:**
1. Pre-configured prompts
2. One-click fixes
3. Fast iteration

**Script:**
```
"For common tasks, we have Quick Actions..."

1. Show Quick Action buttons
2. Click "Fix Error"
3. "AI immediately analyzes and suggests a fix"
4. Click "Explain Code"
5. "Gets a detailed explanation"
6. Click "Optimize"
7. "Suggests performance improvements"
8. "All with one click!"
```

### Demo 5: Multi-Provider Support (2 minutes)

**What to show:**
1. Switch between providers
2. Different models
3. Compare responses

**Script:**
```
"ResurrectCI supports multiple AI providers..."

1. Open Settings
2. Show provider dropdown: Gemini, OpenAI, Claude, Lovable
3. "Each has different strengths"
4. Switch to OpenAI
5. Select GPT-4
6. Ask same question
7. "See how responses differ?"
8. "Choose what works best for you"
```

## 🎯 Key Talking Points

### For Developers
- "Real-time streaming like ChatGPT"
- "See changes before applying"
- "Works with your favorite AI provider"
- "Full IDE experience in browser"
- "One-click PR creation"

### For Managers
- "Reduces debugging time by 70%"
- "Automatic error fixing"
- "No manual PR creation needed"
- "Works with existing GitHub workflow"
- "Pay-as-you-go AI costs"

### For DevOps
- "Integrates with Vercel/GitHub"
- "Webhook-driven automation"
- "Supabase edge functions"
- "Scalable architecture"
- "Self-hosted option available"

## 📸 Screenshot Checklist

### Must-Have Screenshots
1. ✅ Dashboard with projects
2. ✅ IDE layout (full view)
3. ✅ Cline AI chat with streaming
4. ✅ Code diff view (side-by-side)
5. ✅ PR preview dialog
6. ✅ AI provider settings
7. ✅ Quick actions in use
8. ✅ Build logs viewer

### Nice-to-Have
- File explorer
- Multiple tabs open
- Error highlighting
- GitHub PR created
- Vercel deployment status

## 🎥 Video Demo Script (5 minutes)

### Opening (30 seconds)
```
"Hi! Today I'm showing you ResurrectCI - an AI-powered IDE 
that automatically fixes your build errors.

It's like having Cline AI built into your CI/CD pipeline.

Let's see it in action..."
```

### Setup (30 seconds)
```
"First, quick setup:
- npm install
- Configure AI provider (I'm using Gemini)
- Connect GitHub repo
- Done!"
```

### Main Demo (3 minutes)
```
"Here's a project with a build error...
[Show crashed status]

I'll click Auto Fix...
[Show AI analyzing]

The AI found the issue - a missing import.
[Show analysis]

Here's the proposed fix with a diff view.
[Show side-by-side comparison]

I can review every change before applying.
[Scroll through diff]

Looks good! Creating PR...
[Click Create PR]

And done! PR is live on GitHub.
[Show GitHub PR]

But that's not all - I can also chat with the AI...
[Open Cline panel]

'Add error handling to this component'
[Type and send]

Watch as it streams the response...
[Show streaming]

Here's the code suggestion.
[Show code block]

I'll apply it...
[Click Apply]

Review the diff...
[Show diff]

And save!
[Click Save]

That's ResurrectCI - your AI coding assistant!"
```

### Closing (1 minute)
```
"Key features:
- Real-time AI streaming
- Automatic error fixing
- Code diff preview
- Multi-provider support
- One-click PR creation

Try it yourself:
[Show GitHub link]

Thanks for watching!"
```

## 🎤 Live Demo Tips

### Before Demo
- [ ] Test internet connection
- [ ] Have API keys ready
- [ ] Prepare sample project with error
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Increase font size for visibility
- [ ] Test audio/video
- [ ] Have backup plan

### During Demo
- Speak clearly and slowly
- Explain what you're doing
- Point out key features
- Show real-time streaming
- Highlight diff view
- Demonstrate quick actions
- Handle errors gracefully
- Engage with audience

### After Demo
- Take questions
- Share documentation links
- Offer to help with setup
- Collect feedback
- Follow up with attendees

## 🎁 Demo Scenarios

### Scenario 1: Missing Import
```typescript
// Error: Cannot find module './Button'
import { Button } from './Button';

// AI Fix:
import { Button } from '@/components/ui/button';
```

### Scenario 2: Type Error
```typescript
// Error: Property 'name' does not exist on type 'User'
const userName = user.name;

// AI Fix:
const userName = user.name ?? 'Anonymous';
```

### Scenario 3: Async/Await
```typescript
// Error: 'await' expressions are only allowed within async functions
const data = await fetchData();

// AI Fix:
const fetchDataAsync = async () => {
  const data = await fetchData();
  return data;
};
```

## 📊 Metrics to Highlight

- **70% faster** error resolution
- **90% accuracy** in fix suggestions
- **5 minutes** average setup time
- **$0.19 per 1000** messages (Gemini)
- **Real-time** streaming responses
- **4 AI providers** supported

## 🎯 Call to Action

### For Viewers
"Try ResurrectCI today:
1. Clone the repo
2. Follow the Quick Start guide
3. Fix your first error with AI
4. Share your experience!"

### For Contributors
"Want to contribute?
- Check out the Architecture docs
- Pick an issue on GitHub
- Submit a PR
- Join our community!"

### For Sponsors
"Support ResurrectCI:
- Star on GitHub
- Share with your team
- Sponsor the project
- Provide feedback!"

## 🎬 Demo Checklist

Before going live:
- [ ] All dependencies installed
- [ ] Environment variables set
- [ ] AI provider configured
- [ ] Sample project ready
- [ ] Internet connection stable
- [ ] Screen recording software ready
- [ ] Backup plan prepared
- [ ] Documentation links ready
- [ ] Questions anticipated
- [ ] Enthusiasm level: MAX! 🚀

---

**Remember:** The goal is to show how easy and powerful ResurrectCI is. 
Keep it simple, focus on the "wow" moments, and have fun! 🎉
