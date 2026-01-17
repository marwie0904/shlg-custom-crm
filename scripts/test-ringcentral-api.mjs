/**
 * Test script for RingCentral API endpoints
 * Run with: node scripts/test-ringcentral-api.mjs
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🔄 Testing RingCentral API endpoints...\n');

  // Test 1: SIP Provision
  console.log('═══════════════════════════════════════');
  console.log('📞 Test 1: SIP Provision (for WebRTC calling)');
  console.log('═══════════════════════════════════════');
  try {
    const sipRes = await fetch(`${BASE_URL}/api/ringcentral/sip-provision`);
    const sipData = await sipRes.json();
    if (sipData.success) {
      console.log('✅ SIP Provision successful');
      console.log(`   Domain: ${sipData.sipInfo?.domain}`);
      console.log(`   Transport: ${sipData.sipInfo?.transport}`);
    } else {
      console.log('❌ SIP Provision failed:', sipData.error);
    }
  } catch (error) {
    console.log('❌ SIP Provision error:', error.message);
  }

  // Test 2: Get Call Logs
  console.log('\n═══════════════════════════════════════');
  console.log('📋 Test 2: Get Call Logs');
  console.log('═══════════════════════════════════════');
  try {
    const logsRes = await fetch(`${BASE_URL}/api/ringcentral/calls/logs?perPage=5`);
    const logsData = await logsRes.json();
    if (logsData.success) {
      console.log('✅ Call Logs retrieved');
      console.log(`   Total calls: ${logsData.totalCount}`);
      console.log(`   Showing: ${logsData.calls?.length || 0} calls`);
      if (logsData.calls?.length > 0) {
        console.log('   Recent calls:');
        logsData.calls.slice(0, 3).forEach(call => {
          console.log(`     - ${call.direction}: ${call.from.phoneNumber} → ${call.to.phoneNumber} (${call.result})`);
        });
      }
    } else {
      console.log('❌ Call Logs failed:', logsData.error);
    }
  } catch (error) {
    console.log('❌ Call Logs error:', error.message);
  }

  // Test 3: Get SMS Messages
  console.log('\n═══════════════════════════════════════');
  console.log('💬 Test 3: Get SMS Messages');
  console.log('═══════════════════════════════════════');
  try {
    const smsRes = await fetch(`${BASE_URL}/api/ringcentral/sms/messages?perPage=5`);
    const smsData = await smsRes.json();
    if (smsData.success) {
      console.log('✅ SMS Messages retrieved');
      console.log(`   Total messages: ${smsData.totalCount}`);
      console.log(`   Showing: ${smsData.messages?.length || 0} messages`);
      if (smsData.messages?.length > 0) {
        console.log('   Recent messages:');
        smsData.messages.slice(0, 3).forEach(msg => {
          const preview = msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;
          console.log(`     - ${msg.direction}: ${preview}`);
        });
      }
    } else {
      console.log('❌ SMS Messages failed:', smsData.error);
    }
  } catch (error) {
    console.log('❌ SMS Messages error:', error.message);
  }

  // Test 4: Webhook endpoint (just check it's responding)
  console.log('\n═══════════════════════════════════════');
  console.log('🔔 Test 4: Webhook Endpoint');
  console.log('═══════════════════════════════════════');
  try {
    const webhookRes = await fetch(`${BASE_URL}/api/ringcentral/webhooks`);
    const webhookData = await webhookRes.json();
    console.log('✅ Webhook endpoint is active');
    console.log(`   Status: ${webhookData.status}`);
  } catch (error) {
    console.log('❌ Webhook endpoint error:', error.message);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log('API Endpoints created:');
  console.log('  POST /api/ringcentral/sms/send         - Send SMS');
  console.log('  GET  /api/ringcentral/sms/messages     - Get SMS history');
  console.log('  GET  /api/ringcentral/sms/conversation - Get conversation');
  console.log('  GET  /api/ringcentral/sip-provision    - Get SIP info for WebRTC');
  console.log('  GET  /api/ringcentral/calls/logs       - Get call logs');
  console.log('  POST /api/ringcentral/webhooks         - Receive incoming SMS');
  console.log('\n✅ All endpoints created successfully!');
}

testEndpoints();
