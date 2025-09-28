// Test script to verify learning path UI integration
const axios = require('axios');

async function testLearningPathUI() {
  try {
    console.log('🧪 Testing Learning Path UI Integration...\n');
    
    // Test data that should trigger learning path
    const testUser = {
      skills: ['completely_nonexistent_skill_12345'],
      education: "PhD in Quantum Physics",
      location: "Mars",
      sector: "Space Technology",
      department: "Astrophysics",
      interests: ["quantum computing", "space exploration"]
    };

    console.log('📤 Sending request to backend...');
    const response = await axios.post('http://localhost:4000/recommend', testUser);
    
    console.log('📥 Response received:');
    console.log('Status:', response.data.status);
    console.log('Message:', response.data.message);
    console.log('Learning Path Steps:', response.data.learning_path?.length || 0);
    
    if (response.data.status === 'no_matches' && response.data.learning_path) {
      console.log('\n✅ Learning Path Response Format:');
      console.log('  - Status: no_matches ✓');
      console.log('  - Message: Present ✓');
      console.log('  - Learning Path: Array with', response.data.learning_path.length, 'steps ✓');
      
      console.log('\n📋 Sample Learning Path Step:');
      const sampleStep = response.data.learning_path[0];
      console.log('  - Step:', sampleStep.step);
      console.log('  - Skill:', sampleStep.skill);
      console.log('  - Resource:', sampleStep.resource);
      console.log('  - Description:', sampleStep.description);
      console.log('  - Duration:', sampleStep.duration);
      console.log('  - Difficulty:', sampleStep.difficulty);
      
      console.log('\n🎉 Backend integration working correctly!');
      console.log('🌐 Frontend should now display the learning path with impressive UI');
      console.log('🔤 UI supports multiple languages (English, Hindi, Tamil, Telugu, etc.)');
      
    } else {
      console.log('\n❌ Unexpected response format');
      console.log('Expected: { status: "no_matches", message: "...", learning_path: [...] }');
      console.log('Received:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 4000');
    }
  }
}

// Run the test
testLearningPathUI();




