import fetch from 'node-fetch';

async function debugLearningPath() {
  try {
    console.log('🔍 Debugging Learning Path Generation...\n');
    
    const testUser = {
      skills: ['nonexistent_skill_12345'],
      education: "Bachelor's",
      location: "Test City",
      sector: "Technology",
      language: "en"
    };

    console.log('📤 Sending request to backend...');
    const response = await fetch('http://localhost:4000/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log('📥 Response received:');
    console.log('Status:', data.status);
    console.log('Message:', data.message);
    
    if (data.learning_path) {
      console.log('Learning Path Steps:', data.learning_path.length);
      console.log('\nFirst Step Details:');
      console.log('Skill:', data.learning_path[0].skill);
      console.log('Resource:', data.learning_path[0].resource);
      console.log('Description:', data.learning_path[0].description);
    }
    
    // Check if it's using fallback content
    const isFallback = data.learning_path && data.learning_path.some(step => 
      step.skill === 'Communication Skills' || 
      step.skill === 'Microsoft Office Suite' || 
      step.skill === 'Industry Knowledge'
    );
    
    if (isFallback) {
      console.log('\n⚠️  Using fallback content - Grok API not working');
      console.log('💡 Check if GROK_API_KEY is properly configured in .env file');
    } else {
      console.log('\n✅ Using AI-generated content - Grok API working!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLearningPath();



