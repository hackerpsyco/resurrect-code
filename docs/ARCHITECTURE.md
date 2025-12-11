# ResurrectCI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ResurrectCI IDE                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ File Explorer│  │ Code Editor  │  │  Cline AI    │          │
│  │              │  │              │  │              │          │
│  │ - Browse     │  │ - Edit       │  │ - Chat       │          │
│  │ - Search     │  │ - Diff View  │  │ - Stream     │          │
│  │ - Open Files │  │ - Syntax HL  │  │ - Apply Code │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Build Logs Viewer                      │   │
│  │  - Real-time logs  - Error detection  - Log filtering    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI Service Layer                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    AIService Class                        │   │
│  │                                                            │   │
│  │  streamChat(messages) → AsyncGenerator<AIStreamResponse>  │   │
│  │                                                            │   │
│  │  ├─ streamGemini()    ─────────────────────┐             │   │
│  │  ├─ streamOpenAI()    ─────────────────────┤             │   │
│  │  ├─ streamClaude()    ─────────────────────┤             │   │
│  │  └─ streamLovable()   ─────────────────────┤             │   │
│  └────────────────────────────────────────────┼─────────────┘   │
└───────────────────────────────────────────────┼─────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
        ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
        │  Google Gemini    │      │   OpenAI GPT      │      │ Anthropic Claude  │
        │                   │      │                   │      │                   │
        │  - gemini-2.0     │      │  - gpt-4-turbo    │      │  - claude-3-opus  │
        │  - gemini-1.5-pro │      │  - gpt-3.5-turbo  │      │  - claude-3-sonnet│
        └───────────────────┘      └───────────────────┘      └───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────────────────────────┐
        │              Supabase Edge Functions                       │
        │                                                             │
        │  ┌─────────────────┐  ┌─────────────────┐                │
        │  │ ai-chat-stream  │  │   github-api    │                │
        │  │                 │  │                 │                │
        │  │ - Stream proxy  │  │ - Get repo      │                │
        │  │ - Lovable AI    │  │ - Get files     │                │
        │  │ - CORS handling │  │ - Create branch │                │
        │  └─────────────────┘  │ - Update files  │                │
        │                        │ - Create PR     │                │
        │  ┌─────────────────┐  └─────────────────┘                │
        │  │   vercel-api    │                                      │
        │  │                 │  ┌─────────────────┐                │
        │  │ - Deployments   │  │   ai-agent      │                │
        │  │ - Build logs    │  │                 │                │
        │  │ - Events        │  │ - Error analysis│                │
        │  └─────────────────┘  │ - Fix generation│                │
        │                        └─────────────────┘                │
        └───────────────────────────────────────────────────────────┘
                    │                            │
                    ▼                            ▼
        ┌───────────────────┐      ┌───────────────────┐
        │   Lovable AI      │      │   GitHub API      │
        │   Gateway         │      │                   │
        │                   │      │  - Repositories   │
        │  - Multi-model    │      │  - Files          │
        │  - Rate limiting  │      │  - Branches       │
        │  - Credits        │      │  - Pull Requests  │
        └───────────────────┘      └───────────────────┘
```

## Data Flow

### 1. User Asks Question
```
User Input → ClinePanel → AIService → AI Provider → Stream Response
                                                           │
                                                           ▼
                                              Parse Code Blocks
                                                           │
                                                           ▼
                                              Display in Chat
                                                           │
                                                           ▼
                                              User Clicks "Apply"
                                                           │
                                                           ▼
                                              Fetch Original File
                                                           │
                                                           ▼
                                              Show Diff View
                                                           │
                                                           ▼
                                              User Confirms
                                                           │
                                                           ▼
                                              Update File via GitHub API
```

### 2. Auto-Fix Build Error
```
Build Fails → Webhook → ai-agent Function → Analyze Error
                                                  │
                                                  ▼
                                          Generate Fix
                                                  │
                                                  ▼
                                          Fetch Original Files
                                                  │
                                                  ▼
                                          Show PR Preview Dialog
                                                  │
                                                  ▼
                                          User Reviews Diff
                                                  │
                                                  ▼
                                          User Confirms
                                                  │
                                                  ▼
                                          Create Branch
                                                  │
                                                  ▼
                                          Update Files
                                                  │
                                                  ▼
                                          Create Pull Request
```

## Component Hierarchy

```
Dashboard
├── ProjectCard
├── ConnectProjectDialog
├── ProjectDetailPanel
├── PRPreviewDialog
│   └── DiffViewer
└── IDELayout
    ├── ProjectFileTree
    ├── CodeEditor (with diff view)
    ├── BuildLogViewer
    └── ClinePanel
        ├── AIProviderSelector
        └── AIChatPanel
```

## State Management

### Local Storage
- `ai_config` - AI provider configuration (provider, apiKey, model)

### React State
- `messages` - Chat history
- `openFiles` - Currently open files in editor
- `pendingChanges` - Files waiting for PR creation
- `aiService` - Current AI service instance

## API Endpoints

### Supabase Functions
- `POST /functions/v1/ai-chat-stream` - Stream AI responses
- `POST /functions/v1/github-api` - GitHub operations
- `POST /functions/v1/vercel-api` - Vercel operations
- `POST /functions/v1/ai-agent` - Full error analysis

### External APIs
- Google Gemini: `https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent`
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Anthropic: `https://api.anthropic.com/v1/messages`
- Lovable: `https://ai.gateway.lovable.dev/v1/chat/completions`
- GitHub: `https://api.github.com`

## Security

### API Keys
- Stored in browser localStorage (client-side providers)
- Stored in Supabase secrets (server-side providers)
- Never exposed in client code
- Direct API calls from browser (no proxy for client-side)

### CORS
- All Supabase functions include CORS headers
- Supports OPTIONS preflight requests
- Allows all origins for development

### Authentication
- Supabase Auth for user management
- GitHub OAuth for repository access
- API keys for AI providers

## Performance Optimizations

### Streaming
- Real-time response display
- Reduced perceived latency
- Better UX for long responses

### Code Splitting
- Lazy load IDE components
- Separate bundles for different features
- Reduced initial load time

### Caching
- LocalStorage for AI config
- Browser cache for static assets
- GitHub API response caching

## Deployment

### Frontend
- Vite build
- Deploy to Vercel/Netlify
- Environment variables via `.env`

### Backend
- Supabase Edge Functions
- Deploy via Supabase CLI
- Secrets via `supabase secrets set`

## Monitoring

### Logs
- Browser console for client errors
- Supabase logs for function errors
- AI provider logs for API issues

### Metrics
- Response times
- Error rates
- Token usage
- API costs

## Future Enhancements

1. **Multi-file editing** - Edit multiple files simultaneously
2. **Git integration** - Commit, push, pull from IDE
3. **Terminal** - Run commands directly in IDE
4. **Debugging** - Breakpoints and step-through
5. **Collaboration** - Real-time multi-user editing
6. **Voice input** - Talk to Cline AI
7. **Custom prompts** - Save and reuse prompts
8. **Plugin system** - Extend functionality
