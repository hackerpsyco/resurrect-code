// Debug GitHub API Issue
console.log('Testing GitHub API...');

const SUPABASE_URL = 'https://eahpikunzsaacibikwtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHBpa3VuenNhYWNpYmlrd3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDYzNjMsImV4cCI6MjA2MzU4MjM2M30.8XVM3S7qzHMxb6kL44O2C5vIcgMH2b-fPcCWIBlJawA';

async function testGitHubAPI() {
  try {
    console.log('Making request to GitHub API...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/github-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        action: 'get_repo',
        owner: 'facebook',
        repo: 'react'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ SUCCESS: GitHub API is working');
      
      // Now test file tree
      console.log('\nTesting file tree...');
      const treeResponse = await fetch(`${SUPABASE_URL}/functions/v1/github-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          action: 'get_tree',
          owner: 'facebook',
          repo: 'react',
          branch: 'main'
        })
      });

      const treeData = await treeResponse.json();
      console.log('Tree response:', JSON.stringify(treeData, null, 2));
      
    } else {
      console.log('❌ ERROR:', data.error);
    }
  } catch (error) {
    console.error('❌ FETCH ERROR:', error.message);
  }
}

testGitHubAPI();