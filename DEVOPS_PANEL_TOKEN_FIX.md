# DevOps Panel - Token Persistence Fix

## Problem
The DevOps Panel was showing hardcoded demo data instead of real Vercel projects and deployments, even though the token was being saved to localStorage.

## Root Cause
The Vercel API integration had two issues:

1. **Supabase Function Not Using User Token**: The `vercel-api` Supabase function was only looking for `VERCEL_TOKEN` in environment variables, not accepting the user-provided token from the request body.

2. **Hook Using Supabase Function Instead of Direct API**: The `useVercel` hook was calling the Supabase function for all operations, but the function wasn't properly configured to accept user tokens.

## Solution

### 1. Updated `supabase/functions/vercel-api/index.ts`
- Added `token?: string` to the `VercelRequest` interface
- Modified the function to accept token from request body: `const vercelToken = token || VERCEL_TOKEN`
- Now uses user-provided token if available, falls back to environment variable

### 2. Updated `src/hooks/useVercel.ts`
- Changed `fetchProjects()` to use `vercelService.getProjects()` directly instead of Supabase function
- Changed `fetchDeployments()` to use `vercelService.getDeployments()` directly
- Only uses Supabase function for `fetchBuildLogs()` (which handles streaming)
- All methods now pass the token from localStorage to ensure authentication

### 3. Updated `src/components/dashboard/DevOpsPanel.tsx`
- Added listener for `vercel-settings-updated` event to refresh projects when user connects Vercel
- Removed unused imports (`React`, `toast`)
- Debug info card shows token status, projects count, deployments count, and initialization status

## How It Works Now

1. **User connects Vercel** in Settings → GitHub Integration
   - `VercelIntegration.tsx` calls `vercelService.setToken(token)`
   - Token is saved to localStorage
   - Event `vercel-settings-updated` is dispatched

2. **DevOps Panel opens**
   - `useVercel` hook initializes and loads token from localStorage
   - `fetchProjects()` is called automatically
   - Projects are fetched directly from Vercel API using `vercelService`
   - Real data is displayed (not demo data)

3. **User selects a project**
   - `fetchDeployments()` is called with the project ID
   - Real deployments are fetched and displayed
   - User can view deployment details, logs, and status

## Testing

To verify the fix works:

1. Open Settings → Vercel Integration
2. Enter your Vercel token and click "Connect"
3. Open DevOps Panel
4. Check the blue "Debug Info" card:
   - Token: ✅ Found
   - Projects: (should show your actual project count)
   - Deployments: (should show your actual deployment count)
5. Select a project from the dropdown
6. View real deployments and their status

## Files Modified

- `supabase/functions/vercel-api/index.ts` - Accept user token from request
- `src/hooks/useVercel.ts` - Use vercelService directly for API calls
- `src/components/dashboard/DevOpsPanel.tsx` - Listen for settings updates, remove unused imports
