# Cline AI IDE Setup Guide

## Overview
Your ResurrectCI project now includes a Cline-like AI IDE with real-time code diff view, streaming responses, and multi-provider support.

## Features

### 🤖 AI Provider Selection
- **Google Gemini** - Fast and cost-effective
- **OpenAI GPT** - Powerful reasoning
- **Anthropic Claude** - Best for code understanding
- **Lovable AI Gateway** - Pre-configured, no API key needed

### 💬 Real-time Streaming Chat
- Stream AI responses as they're generated
- See code suggestions appear in real-time
- Interactive code blocks with "Apply" buttons

### 📝 Code Diff View
- Side-by-side comparison of original vs modified code
- Syntax highlighting
- Word-level diff highlighting
- Multiple file support

### 🔧 Quick Actions
- **Fix Error** - Automatically analyze and fix build errors
- **Explain Code** - Get detailed code explanations
- **Optimize** - Receive optimization suggestions

## Setup Instructions

### 1. Configure AI Provider

#### Option A: Using Gemini (Recommended for Free Tier)
1. Get API key from https://makersuite.google.com/app/apikey
2. Click "AI Settings" in the IDE
3. Select "Google Gemini"
4. Choose model: `gemini-2.0-flash-exp` (fastest) or `gemini-1.5-pro` (most capable)
5. Paste your API key
6. Click "Save Configuration"

#### Option B: Using OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Select "OpenAI" in settings
3. Choose model: `gpt-4-turbo-preview` or `gpt-3.5-turbo`
4. Paste your API key
5. Save

#### Option C: Using Claude
1. Get API key from https://console.anthropic.com/
2. Select "Anthropic Claude"
3. Choose model: `claude-3-opus-20240229` (best) or `claude-3-sonnet-20240229` (balanced)
4. Paste your API key
5. Save

#### Option D: Using Lovable AI Gateway (No API Key Required)
1. Deploy the `ai-chat-stream` Supabase function:
   ```bash
   supabase functions deploy ai-chat-stream
   ```
2. Set your Lovable API key in Supabase:
   ```bash
   supabase secrets set LOVABLE_API_KEY=your_key_here
   ```
3. Select "Lovable AI Gateway" in settings
4. No API key needed in the UI!

### 2. Deploy Supabase Functions

```bash
# Deploy the AI chat streaming function
supabase functions deploy ai-chat-stream

# Set required secrets
supabase secrets set LOVABLE_API_KEY=your_lovable_key
```

### 3. Update Environment Variables

Add to your `.env` file:
```env
VITE_SUPABASE_URL=https://eahpikunzsaacibikwtj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Usage

### Opening the IDE
1. Go to Dashboard
2. Click on any project card
3. Click "Open IDE" button
4. The full IDE interface will open

### Using Cline AI
1. **Quick Actions**: Click pre-configured buttons for common tasks
2. **Custom Prompts**: Type your question in the chat input
3. **Apply Code**: Click "Apply" on code blocks to insert into files
4. **Real-time Streaming**: Watch responses appear as they're generated

### Example Prompts
```
"Fix the module not found error in src/App.tsx"

"Explain how the useAIAgent hook works"

"Optimize the database queries in this file"

"Create a new component for displaying user profiles"

"Add error handling to the API calls"
```

### Applying Code Changes
1. AI suggests code with file path
2. Click "Apply to [filename]" button
3. Code opens in editor with diff view
4. Review changes in side-by-side view
5. Edit if needed
6. Click "Save" to commit changes

### Creating Pull Requests
1. Make changes via AI or manual editing
2. Modified files show a dot indicator
3. Click "Create PR" in header
4. PR is created with all changes

## Architecture

### Components
- **AIProviderSelector** - Configure AI provider and model
- **AIChatPanel** - Chat interface with streaming
- **CodeEditor** - Editor with diff view
- **ClinePanel** - Main Cline AI interface
- **IDELayout** - Full IDE layout

### Services
- **AIService** - Handles streaming for all providers
  - `streamGemini()` - Google Gemini streaming
  - `streamOpenAI()` - OpenAI streaming
  - `streamClaude()` - Anthropic streaming
  - `streamLovable()` - Lovable AI Gateway streaming

### Edge Functions
- **ai-chat-stream** - Proxy for Lovable AI Gateway with streaming support

## API Costs (Approximate)

### Gemini
- Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- Pro: $1.25 per 1M input tokens, $5.00 per 1M output tokens

### OpenAI
- GPT-4 Turbo: $10 per 1M input tokens, $30 per 1M output tokens
- GPT-3.5 Turbo: $0.50 per 1M input tokens, $1.50 per 1M output tokens

### Claude
- Opus: $15 per 1M input tokens, $75 per 1M output tokens
- Sonnet: $3 per 1M input tokens, $15 per 1M output tokens

### Lovable AI Gateway
- Varies by model, check Lovable pricing

## Troubleshooting

### "Please configure AI provider first"
- Click the Settings icon in Cline panel
- Select a provider and enter API key
- Save configuration

### Streaming not working
- Check browser console for errors
- Verify API key is correct
- Try a different provider

### Code not applying
- Ensure file path is included in AI response
- Check that repository is connected
- Verify GitHub permissions

### Rate limits
- Gemini: 60 requests per minute (free tier)
- OpenAI: Varies by plan
- Claude: Varies by plan
- Consider using Lovable AI Gateway for higher limits

## Best Practices

1. **Start with Quick Actions** - Use pre-configured prompts for common tasks
2. **Provide Context** - Open relevant files before asking questions
3. **Review Diffs** - Always review code changes before applying
4. **Iterate** - Ask follow-up questions to refine solutions
5. **Save Often** - Commit changes frequently

## Security

- API keys are stored in browser localStorage only
- Keys are never sent to ResurrectCI servers
- Direct API calls from browser to AI providers
- Lovable AI Gateway option for server-side API key storage

## Next Steps

1. Configure your preferred AI provider
2. Try the quick actions on a crashed build
3. Experiment with custom prompts
4. Review and apply suggested fixes
5. Create PRs with your changes

Happy coding with Cline AI! 🚀
