/**
 * JIRA Issue Creation Test
 * 
 * Tests creating an issue in the TEST project
 */

import { 
  getProjects, 
  createIssue,
  getIssueTransitions,
  getProjectIssueTypes,
  testJiraConnection
} from '../src/services/jiraService.js';

async function testIssueCreation() {
  console.log('\n🎯 TESTING JIRA ISSUE CREATION\n');
  console.log('-------------------------------------------');

  // Test 1: Verify connection
  console.log('\n1️⃣ Verifying Connection...');
  const authResult = await testJiraConnection();
  if (!authResult.success) {
    console.log('❌ Authentication failed:', authResult.error);
    return;
  }
  console.log('✅ Connected as:', authResult.user.displayName);

  // Test 2: Get projects and find TEST project
  console.log('\n2️⃣ Finding TEST Project...');
  const projects = await getProjects('test-user');
  const testProject = projects.find(p => p.key === 'TEST');
  
  if (!testProject) {
    console.log('❌ TEST project not found');
    return;
  }
  
  console.log(`✅ Found TEST project: ${testProject.name}`);

  // Test 3: Get available issue types
  console.log('\n3️⃣ Getting Available Issue Types...');
  const issueTypes = await getProjectIssueTypes('TEST');
  console.log(`✅ Found ${issueTypes.length} issue types in TEST project:`);
  issueTypes.forEach(issueType => {
    console.log(`   - ${issueType.name} (ID: ${issueType.id})`);
  });

  if (issueTypes.length === 0) {
    console.log('❌ No issue types found in TEST project');
    return;
  }

  // Use the first available issue type
  const firstIssueType = issueTypes[0];
  console.log(`\n🎯 Using issue type: ${firstIssueType.name}`);

  // Test 4: Create a test issue in TEST project
  console.log('\n4️⃣ Creating Test Issue in TEST Project...');
  try {
    const testIssueData = {
      projectKey: 'TEST',
      summary: 'S.I.R.I.U.S. Integration Test',
      // Removed description as it requires Atlassian Document Format
      issueType: firstIssueType.name,
      priority: 'Medium',
      labels: ['sirius-test', 'integration']
      // Removed components field as it's not supported in this project
    };

    const newIssue = await createIssue('test-user', testIssueData);
    console.log('✅ Test issue created successfully!');
    console.log(`   - Key: ${newIssue.key}`);
    console.log(`   - Summary: ${newIssue.summary}`);
    console.log(`   - Status: ${newIssue.status}`);
    console.log(`   - Priority: ${newIssue.priority}`);
    console.log(`   - URL: https://joseforg.atlassian.net/browse/${newIssue.key}`);

    // Test 5: Get transitions for the new issue
    console.log('\n5️⃣ Fetching Issue Transitions...');
    const transitions = await getIssueTransitions(newIssue.key);
    console.log(`✅ Found ${transitions.length} available transitions for ${newIssue.key}:`);
    transitions.forEach(transition => {
      console.log(`   - ${transition.name} (ID: ${transition.id})`);
    });

    console.log('\n🎉 Issue creation test completed successfully!');
    console.log(`📋 You can view the issue at: https://joseforg.atlassian.net/browse/${newIssue.key}`);

  } catch (error) {
    console.log('❌ Failed to create test issue:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if TEST project allows issue creation');
    console.log('2. Verify issue type "Task" exists in TEST project');
    console.log('3. Check project permissions for your user');
  }
}

// Run the test
testIssueCreation().catch(console.error); 