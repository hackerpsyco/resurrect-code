# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5fad9606-3f59-4d77-9f88-03c05c932160

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5fad9606-3f59-4d77-9f88-03c05c932160) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase Edge Functions
- React Diff Viewer (for code change previews)

## Features

### 🤖 Cline-like AI IDE

ResurrectCI includes a full-featured AI-powered IDE similar to Cline:

- **Multi-Provider Support**: Choose between Gemini, OpenAI, Claude, or Lovable AI Gateway
- **Real-time Streaming**: See AI responses appear as they're generated
- **Interactive Code Blocks**: Apply code suggestions directly to files with one click
- **Side-by-side Diff View**: Review changes before applying
- **Quick Actions**: Fix errors, explain code, or optimize with pre-configured prompts
- **Full IDE Experience**: File explorer, code editor, build logs, and AI chat in one interface

[📖 Read the full Cline AI Setup Guide](./CLINE_AI_SETUP.md)

### 🔍 Diff View for PR Changes

Before creating a pull request, ResurrectCI shows you a side-by-side diff view of all proposed changes:

- **Visual Code Comparison**: See original vs. modified code with syntax highlighting
- **Multiple File Support**: Review changes across multiple files in one view
- **PR Preview**: Review the PR title and description before submission
- **Confirm or Cancel**: Approve changes or cancel to make adjustments

The diff viewer automatically fetches the original file content from GitHub and compares it with the AI-generated fixes, giving you full transparency and control before any code is committed.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5fad9606-3f59-4d77-9f88-03c05c932160) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
