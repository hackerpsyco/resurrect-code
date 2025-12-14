#!/usr/bin/env node

/**
 * Simple Kestra Connection Test
 * Tests if Kestra server is running and webhook is accessible
 */

const KESTRA_URL = 'http://localhost:8080';
const WEBHOOK_URL = `${KESTRA_URL}/api/v1/executions/webhook/resurrectci/resurrect-agent/resurrectci`;

async function testKestraConnection() {
  console.log('🔍 Testing Kestra Connection...\n');

  // Test 1: Health Check
  console.log('1. Testing Kestra server health...');
  try {
    const healthResponse = await fetch(`${KESTRA_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Kestra server is running');
    } else {
      console.log(`⚠️ Health check returned: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Kestra server not reachable');
    console.log('💡 Start with: docker run -p 8080:8080 kestra/kestra:latest server local\n');
    return;
  }

  // Test 2: Webhook Test
  console.log('\n2. Testing webhook endpoint...');
  console.log(`URL: ${WEBHOOK_URL}`);
  
  try {
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: 'test_connection',
        project_name: 'test-project',
        branch: 'main',
        error_message: 'Connection test',
        error_logs: ['Testing webhook connection']
      })
    });

    console.log(`Response: ${webhookResponse.status} ${webhookResponse.statusText}`);

    if (webhookResponse.ok) {
      console.log('✅ Webhook working - workflow executed');
      const result = await webhookResponse.text();
      console.log('Response:', result.substring(0, 200) + '...');
    } else if (webhookResponse.status === 404) {
      console.log('⚠️ Workflow not found - deploy resurrect-agent.yml to Kestra');
      console.log('💡 Go to http://localhost:8080 and upload the workflow file');
    } else if (webhookResponse.status === 400) {
      console.log('⚠️ Bad request - workflow exists but has validation issues');
    } else {
      console.log('❌ Webhook failed');
    }
  } catch (error) {
    console.log('❌ Webhook test failed:', error.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Ensure Kestra is running: docker run -p 8080:8080 kestra/kestra:latest server local');
  console.log('2. Open Kestra UI: http://localhost:8080');
  console.log('3. Deploy workflow: Upload kestra/workflows/resurrect-agent.yml');
  console.log('4. Test automation in ResurrectCI dashboard');
}

// Run the test
testKestraConnection().catch(console.error);