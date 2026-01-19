# DevOps Panel Troubleshooting Guide

## Issue: DevOps Panel Shows Nothing / No Data Displaying

### Root Cause
The DevOps Panel wasn't showing data because:
1. Vercel token wasn't being initialized in the `useVercel` hook
2. The hook wasn't checking if the token existed in localStorage
3. No error message was shown to guide users to connect Vercel

### What Was Fixed

#### 1. Updated `useVercel` Hook
**File**: `src/hooks/useVercel.ts`

**Changes**:
- Added `useEffect` to initialize Vercel service with token from localStorage on mount
- Added `isInitialized` state to track when hook is ready
- Added token validation before making API calls
- Added better error handling with descriptive messages
- Projects now only fetch after initialization

**Before**:
```typescript
export function useVercel() {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  // ... no initialization
}
```

**After**:
```typescript
export function useVercel() {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Vercel service with token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('vercel_token');
    if (token && !vercelService.isAuthenticated()) {
      vercelService.setToken(token);
    }
    setIsInitialized(true);
  }, []);
}
```

#### 2. Updated DevOps Panel
**File**: `src/components/dashboard/DevOpsPanel.tsx`

**Changes**:
- Added `isInitialized` check before fetching projects
- Added warning card when Vercel isn't connected
- Better loading states and error messages
- Projects only fetch after hook is initialized

**Before**:
```typescript
useEffect(() => {
  fetchProjects();
}, [fetchProjects]);
```

**After**:
```typescript
useEffect(() => {
  if (isInitialized) {
    fetchProjects();
  }
}, [isInitialized, fetchProjects]);
```

#### 3. Added Vercel Connection Warning
When Vercel isn't connected, users now see:
- Yellow warning card
- Clear message: "Vercel Not Connected"
- "Connect Vercel" button to guide them to settings

## How to Fix: Step-by-Step

### Step 1: Connect Vercel Account
1. Open ResurrectCI Dashboard
2. Click **Settings** (gear icon)
3. Go to **Integrations** tab
4. Click **Vercel** tab
5. Get your token from [Vercel Settings → Tokens](https://vercel.com/account/tokens)
6. Paste token and click **Connect**

### Step 2: Verify Connection
1. You should see: "Connected to Vercel as [username]"
2. Your projects should appear below
3. Click **Save** to confirm

### Step 3: Open DevOps Panel
1. Go back to Dashboard
2. Click **DevOps** button
3. You should now see:
   - Total Projects count
   - Total Deployments count
   - Ready Deployments count
   - System Status

### Step 4: View Projects and Deployments
1. Go to **Deployments** tab
2. Select a project from the list
3. Click **Refresh** to reload
4. Recent deployments should appear
5. Click **Logs** to view build logs

## Verification Checklist

- [ ] Vercel token is valid (from https://vercel.com/account/tokens)
- [ ] Token has "Full Account" scope
- [ ] You have projects in your Vercel account
- [ ] DevOps Panel shows "Connected to Vercel" message
- [ ] Projects list is populated
- [ ] Deployments appear when you select a project
- [ ] Build logs display when you click "Logs"

## Common Issues and Solutions

### Issue 1: "Vercel Not Connected" Message
**Cause**: Token not set in localStorage

**Solution**:
1. Go to Settings → Integrations → Vercel
2. Enter your Vercel token
3. Click "Connect"
4. Refresh the page

### Issue 2: "Failed to fetch projects"
**Cause**: Invalid token or API error

**Solution**:
1. Verify token is correct at https://vercel.com/account/tokens
2. Check token has "Full Account" scope
3. Try disconnecting and reconnecting
4. Check browser console for detailed error

### Issue 3: Projects List is Empty
**Cause**: No projects in Vercel account or token doesn't have access

**Solution**:
1. Verify you have projects in https://vercel.com/dashboard
2. Check token scope is "Full Account"
3. Try creating a new project in Vercel
4. Refresh DevOps Panel

### Issue 4: Deployments Not Showing
**Cause**: Project selected but no deployments exist

**Solution**:
1. Make sure you selected a project
2. Check if project has any deployments in Vercel
3. Try clicking "Refresh" button
4. Create a new deployment in Vercel

### Issue 5: Build Logs Not Displaying
**Cause**: Deployment doesn't have logs or logs not available

**Solution**:
1. Make sure deployment has completed
2. Try clicking "Logs" again
3. Check if deployment was imported (imported deployments may not have logs)
4. Try a different deployment

## Technical Details

### Data Flow
```
DevOps Panel
    ↓
useVercel Hook (initializes with token from localStorage)
    ↓
vercelService (Vercel API client)
    ↓
Supabase Edge Function (vercel-api)
    ↓
Vercel API
    ↓
Real Projects & Deployments
```

### Token Storage
- Token stored in: `localStorage.vercel_token`
- User cached in: `localStorage.vercel_user`
- Teams cached in: `localStorage.vercel_teams`

### Initialization Flow
1. Component mounts
2. `useVercel` hook initializes
3. Checks for token in localStorage
4. Sets token in vercelService
5. Sets `isInitialized` to true
6. DevOps Panel fetches projects
7. Data displays in UI

## Browser Console Debugging

Open browser console (F12) and look for:

**Success messages**:
```
✅ Loaded 5 Vercel projects
✅ GitHub connected as: username
```

**Warning messages**:
```
⚠️ Vercel token not found - user needs to connect Vercel account
⚠️ Vercel not connected
```

**Error messages**:
```
❌ Error fetching projects: Invalid token
❌ Vercel authentication failed: 403 Forbidden
```

## Files Modified

1. `src/hooks/useVercel.ts` - Added initialization logic
2. `src/components/dashboard/DevOpsPanel.tsx` - Added warning card and initialization check

## Testing

### Manual Testing Steps

1. **Test without token**:
   - Clear localStorage
   - Open DevOps Panel
   - Should see "Vercel Not Connected" warning

2. **Test with token**:
   - Connect Vercel account
   - Open DevOps Panel
   - Should see projects and deployments

3. **Test project selection**:
   - Select a project
   - Should see deployments for that project
   - Should see build logs when clicking "Logs"

4. **Test refresh**:
   - Click "Refresh" button
   - Should reload projects
   - Data should update

## Next Steps

1. ✅ Connect Vercel account
2. ✅ Verify projects display
3. ✅ View deployments
4. ⏭️ Set up error detection
5. ⏭️ Configure auto-fix workflows

## Support

If you still have issues:
1. Check browser console for error messages
2. Verify Vercel token is valid
3. Try disconnecting and reconnecting
4. Clear browser cache and refresh
5. Check Vercel API status at https://status.vercel.com

