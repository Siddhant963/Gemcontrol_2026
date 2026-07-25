// Test script for the new Girvi Interest Management API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/admin';

// Test functions
async function testInterestAPIs() {
  try {
    console.log('🧪 Testing Girvi Interest Management APIs...\n');

    // Test 1: Get Girvi Summary
    console.log('1. Testing Girvi Summary...');
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/getGirviSummary`);
      console.log('✅ Girvi Summary:', summaryResponse.data);
    } catch (error) {
      console.log('❌ Girvi Summary failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Get All Pending Interests
    console.log('\n2. Testing Pending Interests...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/getAllPendingInterests`);
      console.log('✅ Pending Interests:', pendingResponse.data.length, 'records');
    } catch (error) {
      console.log('❌ Pending Interests failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API Testing Complete!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testInterestAPIs();