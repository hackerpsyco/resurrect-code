/**
 * GitHub Token Sync Service
 * Syncs GitHub token from localStorage to Supabase user metadata
 */

import { toast } from 'sonner';

export async function syncGitHubTokenToSupabase(): Promise<boolean> {
  try {
    console.log('🔄 Starting GitHub token sync...');

    // Get token from localStorage
    const githubToken = localStorage.getItem('github_token');
    const githubUser = localStorage.getItem('github_user');

    if (!githubToken || !githubUser) {
      console.warn('⚠️ GitHub token not found in localStorage');
      toast.error('GitHub not connected. Please connect GitHub first.');
      return false;
    }

    const userData = JSON.parse(githubUser);
    console.log(`📤 Syncing token for user: ${userData.login}`);

    // Get Supabase config
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase not configured');
      toast.error('Supabase configuration missing');
      return false;
    }

    // Get auth token
    const authToken = localStorage.getItem('sb_auth_token');
    if (!authToken) {
      console.error('❌ Not authenticated');
      toast.error('Not authenticated. Please log in.');
      return false;
    }

    console.log('📤 Saving GitHub token to Supabase user metadata...');

    // Save to Supabase metadata
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        user_metadata: {
          github_token: githubToken,
          github_login: userData.login,
          github_id: userData.id,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ Failed to sync token:', error);
      toast.error('Failed to sync GitHub token to Supabase');
      return false;
    }

    console.log('✅ GitHub token synced to Supabase successfully');
    toast.success('✅ GitHub token synced to Supabase!');
    return true;
  } catch (error) {
    console.error('❌ Error syncing GitHub token:', error);
    toast.error('Error syncing GitHub token');
    return false;
  }
}

export async function verifyGitHubTokenInSupabase(): Promise<boolean> {
  try {
    console.log('🔍 Verifying GitHub token in Supabase...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase not configured');
      return false;
    }

    const authToken = localStorage.getItem('sb_auth_token');
    if (!authToken) {
      console.error('❌ Not authenticated');
      return false;
    }

    // Get current user
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch user');
      return false;
    }

    const user = await response.json();
    const githubToken = user.user_metadata?.github_token;

    if (githubToken) {
      console.log('✅ GitHub token found in Supabase metadata');
      console.log(`📋 GitHub login: ${user.user_metadata?.github_login}`);
      return true;
    } else {
      console.warn('⚠️ GitHub token NOT found in Supabase metadata');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying GitHub token:', error);
    return false;
  }
}
