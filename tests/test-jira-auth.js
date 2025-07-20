/**
 * JIRA Authentication Test Script
 * 
 * Tests JIRA API authentication and provides troubleshooting guidance
 * based on the official Jira API troubleshooting guide.
 */

import { testJiraConnection, getProjects } from '../src/services/jiraService.js';
import config from '../src/config/index.js';

async function testJiraAuthentication() {
  console.log('\n🔐 TESTING JIRA AUTHENTICATION\n');
  console.log('Environment Configuration:');
  console.log(`- JIRA_BASE_URL: ${config.JIRA.BASE_URL || 'Not set'}`);
  console.log(`- JIRA_EMAIL: ${config.JIRA.EMAIL ? `${config.JIRA.EMAIL.substring(0, 3)}***@${config.JIRA.EMAIL.split('@')[1]}` : 'Not set'}`);
  console.log(`- JIRA_API_TOKEN: ${config.JIRA.API_TOKEN ? 'Set (hidden)' : 'Not set'}`);
  console.log('-------------------------------------------');

  // Test 1: Basic Authentication
  console.log('\n1️⃣ Testing JIRA Authentication...');
  const authResult = await testJiraConnection();
  
  if (authResult.success) {
    console.log('✅ Authentication successful!');
    console.log(`   User: ${authResult.user.displayName}`);
    console.log(`   Email: ${authResult.user.emailAddress}`);
    console.log(`   Account ID: ${authResult.user.accountId}`);
    console.log(`   Active: ${authResult.user.active}`);
    console.log(`   Timezone: ${authResult.user.timeZone}`);
    
    // Test 2: Fetch Projects (if auth successful)
    console.log('\n2️⃣ Testing Project Access...');
    try {
      const projects = await getProjects('test-user');
      console.log(`✅ Successfully fetched ${projects.length} projects`);
      
      if (projects.length > 0) {
        console.log('   Sample projects:');
        projects.slice(0, 3).forEach(project => {
          console.log(`   - ${project.key}: ${project.name}`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to fetch projects:', error.message);
    }
    
  } else {
    console.log('❌ Authentication failed!');
    console.log(`   Error: ${authResult.error}`);
    console.log('\n🔧 Troubleshooting Steps:');
    authResult.troubleshooting.forEach(step => {
      console.log(`   ${step}`);
    });
    
    console.log('\n📋 Additional Checks:');
    console.log('   1. Verify your .env file has the correct variables:');
    console.log('      JIRA_BASE_URL=https://your-domain.atlassian.net');
    console.log('      JIRA_EMAIL=your-email@domain.com');
    console.log('      JIRA_API_TOKEN=your-api-token');
    console.log('   2. Test with curl command:');
    console.log(`      curl -u ${config.JIRA.EMAIL}:YOUR_API_TOKEN \\`);
    console.log(`           -H "Accept: application/json" \\`);
    console.log(`           "${config.JIRA.BASE_URL}/rest/api/3/myself"`);
  }
  
  console.log('\n-------------------------------------------');
  console.log('Test completed.');
}

// Run the test
testJiraAuthentication().catch(console.error); 