import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Learning Path Service using Grok API
 * Generates personalized learning roadmaps when no internship matches are found
 */
class LearningPathService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  /**
   * Generate a personalized learning path based on user profile
   * @param {Object} userProfile - User's profile information
   * @param {Array} userProfile.skills - User's current skills
   * @param {string} userProfile.education - User's education level
   * @param {Array} userProfile.interests - User's interests
   * @param {string} userProfile.location - User's location
   * @param {string} userProfile.department - User's department
   * @param {string} userProfile.sector - User's preferred sector
   * @param {string} userProfile.language - User's selected language
   * @returns {Promise<Object>} Learning path response
   */
  async generateLearningPath(userProfile) {
    try {
      if (!this.apiKey || this.apiKey === 'your_grok_api_key_here') {
        throw new Error('Groq API key not configured');
      }

      const prompt = this.buildPrompt(userProfile);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI career advisor specializing in creating personalized learning paths for students seeking internships. Output MUST be a single valid JSON object matching the requested schema. Do not include any prose, markdown, or code fences.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          // Ask Groq (OpenAI-compatible) to return a strict JSON object
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Groq API error:', response.status, response.statusText, errorText);
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';

      // Try to parse JSON directly first
      let learningPath;
      if (content && content.trim()) {
        try {
          const parsed = JSON.parse(content);
          learningPath = Array.isArray(parsed?.learning_path) ? parsed.learning_path : this.parseLearningPath(content);
        } catch (_) {
          learningPath = this.parseLearningPath(content);
        }
      } else {
        throw new Error('Empty response from Groq API');
      }
      
      return {
        status: 'no_matches',
        message: 'No direct internship matches found. Here\'s your personalized learning path.',
        learning_path: learningPath
      };

    } catch (error) {
      console.error('Learning path generation error:', error);
      
      // Return fallback learning path
      return {
        status: 'no_matches',
        message: 'Learning path unavailable, please try again later.',
        learning_path: this.getFallbackLearningPath(userProfile)
      };
    }
  }

  /**
   * Build the prompt for Grok API
   * @param {Object} userProfile - User's profile information
   * @returns {string} Formatted prompt
   */
  buildPrompt(userProfile) {
    const skills = Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : 'None specified';
    const interests = Array.isArray(userProfile.interests) ? userProfile.interests.join(', ') : 'Not specified';
    const language = userProfile.language || 'en';
    
    // Language mapping for Grok API
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'ur': 'Urdu'
    };
    
    const targetLanguage = languageMap[language] || 'English';
    
    return `Create a personalized learning path for a student seeking internships. 

**Student Profile:**
- Current Skills: ${skills}
- Education Level: ${userProfile.education || 'Not specified'}
- Department: ${userProfile.department || 'Not specified'}
- Preferred Sector: ${userProfile.sector || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Interests: ${interests}

**Requirements:**
1. Generate a stepwise learning roadmap with 3-5 steps
2. Each step should include: skill to learn, specific resource/course, and brief description
3. Focus on skills that are commonly required for internships in their sector
4. Include both technical and soft skills
5. Suggest practical projects or certifications where relevant
6. IMPORTANT: Generate all content in ${targetLanguage} language

**Response Format (JSON):**
{
  "learning_path": [
    {
      "step": 1,
      "skill": "Skill Name in ${targetLanguage}",
      "resource": "Specific Course/Resource in ${targetLanguage}",
      "description": "Brief description of what to learn in ${targetLanguage}",
      "duration": "Estimated time (e.g., 2-3 weeks)",
      "difficulty": "Beginner/Intermediate/Advanced"
    }
  ]
}

Please provide a structured learning path in ${targetLanguage} that will help this student qualify for relevant internships.`;
  }

  /**
   * Parse the learning path from Grok's response
   * @param {string} content - Raw content from Grok API
   * @returns {Array} Parsed learning path steps
   */
  parseLearningPath(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.learning_path || [];
      }
      
      // If no JSON found, try to parse as structured text
      return this.parseTextLearningPath(content);
    } catch (error) {
      console.error('Error parsing learning path:', error);
      return this.parseTextLearningPath(content);
    }
  }

  /**
   * Parse learning path from text format if JSON parsing fails
   * @param {string} content - Raw content from Grok API
   * @returns {Array} Parsed learning path steps
   */
  parseTextLearningPath(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const steps = [];
    let stepNumber = 1;

    for (const line of lines) {
      if (line.includes('step') || line.includes('skill') || line.includes('learn')) {
        // Extract skill and resource from the line
        const skillMatch = line.match(/(?:skill|learn)[:\s]+([^,]+)/i);
        const resourceMatch = line.match(/(?:course|resource|platform)[:\s]+([^,]+)/i);
        
        if (skillMatch) {
          steps.push({
            step: stepNumber,
            skill: skillMatch[1].trim(),
            resource: resourceMatch ? resourceMatch[1].trim() : 'Online course or tutorial',
            description: line.trim(),
            duration: '2-4 weeks',
            difficulty: 'Intermediate'
          });
          stepNumber++;
        }
      }
    }

    return steps.length > 0 ? steps : this.getDefaultLearningPath();
  }

  /**
   * Get fallback learning path when API fails
   * @param {Object} userProfile - User's profile information
   * @returns {Array} Fallback learning path
   */
  getFallbackLearningPath(userProfile) {
    const sector = (userProfile.sector || '').toLowerCase();
    const skills = userProfile.skills || [];
    const language = userProfile.language || 'en';
    
    // Language-specific fallback content
    const fallbackContent = {
      en: {
        tech: [
          { skill: 'Programming Fundamentals', resource: 'Codecademy - Python or JavaScript', description: 'Learn basic programming concepts and syntax' },
          { skill: 'Web Development', resource: 'FreeCodeCamp - Responsive Web Design', description: 'Build interactive websites with HTML, CSS, and JavaScript' },
          { skill: 'Version Control', resource: 'GitHub Learning Lab', description: 'Master Git and GitHub for collaborative development' }
        ],
        business: [
          { skill: 'Digital Marketing', resource: 'Google Digital Marketing Course', description: 'Learn SEO, SEM, and social media marketing' },
          { skill: 'Data Analysis', resource: 'Coursera - Data Analysis with Excel', description: 'Master Excel for business analytics and reporting' },
          { skill: 'Project Management', resource: 'LinkedIn Learning - Project Management Fundamentals', description: 'Learn agile methodologies and project planning' }
        ],
        general: [
          { skill: 'Communication Skills', resource: 'Coursera - Business Communication', description: 'Develop professional communication and presentation skills' },
          { skill: 'Microsoft Office Suite', resource: 'Microsoft Learn - Office 365', description: 'Master Word, Excel, and PowerPoint for professional use' },
          { skill: 'Industry Knowledge', resource: 'Industry-specific online courses', description: 'Learn about current trends and practices in your field' }
        ]
      },
      hi: {
        tech: [
          { skill: 'प्रोग्रामिंग मूल बातें', resource: 'Codecademy - Python या JavaScript', description: 'बुनियादी प्रोग्रामिंग अवधारणाओं और सिंटैक्स को सीखें' },
          { skill: 'वेब डेवलपमेंट', resource: 'FreeCodeCamp - रेस्पॉन्सिव वेब डिज़ाइन', description: 'HTML, CSS, और JavaScript के साथ इंटरैक्टिव वेबसाइट बनाएं' },
          { skill: 'वर्जन कंट्रोल', resource: 'GitHub Learning Lab', description: 'सहयोगी विकास के लिए Git और GitHub में महारत हासिल करें' }
        ],
        business: [
          { skill: 'डिजिटल मार्केटिंग', resource: 'Google Digital Marketing Course', description: 'SEO, SEM, और सोशल मीडिया मार्केटिंग सीखें' },
          { skill: 'डेटा विश्लेषण', resource: 'Coursera - Excel के साथ डेटा विश्लेषण', description: 'व्यावसायिक विश्लेषण और रिपोर्टिंग के लिए Excel में महारत हासिल करें' },
          { skill: 'प्रोजेक्ट मैनेजमेंट', resource: 'LinkedIn Learning - प्रोजेक्ट मैनेजमेंट फंडामेंटल्स', description: 'एजाइल मेथोडोलॉजी और प्रोजेक्ट प्लानिंग सीखें' }
        ],
        general: [
          { skill: 'संचार कौशल', resource: 'Coursera - व्यावसायिक संचार', description: 'पेशेवर संचार और प्रस्तुति कौशल विकसित करें' },
          { skill: 'Microsoft Office Suite', resource: 'Microsoft Learn - Office 365', description: 'पेशेवर उपयोग के लिए Word, Excel, और PowerPoint में महारत हासिल करें' },
          { skill: 'उद्योग ज्ञान', resource: 'उद्योग-विशिष्ट ऑनलाइन पाठ्यक्रम', description: 'अपने क्षेत्र में वर्तमान रुझानों और प्रथाओं के बारे में जानें' }
        ]
      }
    };
    
    const content = fallbackContent[language] || fallbackContent.en;
    let pathType = 'general';
    
    if (sector.includes('tech') || sector.includes('software')) {
      pathType = 'tech';
    } else if (sector.includes('marketing') || sector.includes('business')) {
      pathType = 'business';
    }
    
    const steps = content[pathType];
    return steps.map((step, index) => ({
      step: index + 1,
      skill: step.skill,
      resource: step.resource,
      description: step.description,
      duration: index === 0 ? '3-4 weeks' : index === 1 ? '4-6 weeks' : '2-3 weeks',
      difficulty: index === 0 ? 'Beginner' : index === 1 ? 'Intermediate' : 'Beginner'
    }));
  }

  /**
   * Get default learning path when all parsing fails
   * @returns {Array} Default learning path
   */
  getDefaultLearningPath() {
    return [
      {
        step: 1,
        skill: 'Core Skills Development',
        resource: 'Online learning platforms (Coursera, Udemy, edX)',
        description: 'Focus on building fundamental skills relevant to your field',
        duration: '4-6 weeks',
        difficulty: 'Beginner'
      },
      {
        step: 2,
        skill: 'Practical Projects',
        resource: 'Create portfolio projects',
        description: 'Build hands-on projects to demonstrate your skills',
        duration: '3-4 weeks',
        difficulty: 'Intermediate'
      },
      {
        step: 3,
        skill: 'Professional Networking',
        resource: 'LinkedIn Learning - Professional Development',
        description: 'Learn networking and professional communication skills',
        duration: '2-3 weeks',
        difficulty: 'Beginner'
      }
    ];
  }
}

export default LearningPathService;
