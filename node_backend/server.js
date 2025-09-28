import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import { getAllInternships, getById, filter, getDistinctValues } from './dataLoader.js';
import LearningPathService from './learningPathService.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '.env');
const envExists = fs.existsSync(ENV_PATH);
// Helpful diagnostics in case env isn't being picked up
console.log(`[env] cwd=${process.cwd()} __dirname=${__dirname} envPath=${ENV_PATH} exists=${envExists}`);
dotenv.config({ path: ENV_PATH, override: true, debug: true });
// Fallback: If nothing was loaded but file exists, try UTF-16LE or BOM decoding and manual parse
if (envExists && !process.env.USE_JSON_DATA) {
  try {
    const raw = fs.readFileSync(ENV_PATH);
    // Detect UTF-16LE by presence of many null bytes
    const hasNulls = raw.includes(0x00);
    let text;
    if (hasNulls) {
      text = raw.toString('utf16le');
      console.log('[env] Detected potential UTF-16LE encoding, attempting manual parse');
    } else {
      // Also handle UTF-8 with BOM
      text = raw.toString('utf8').replace(/^\uFEFF/, '');
    }
    const parsed = dotenv.parse(text);
    const keys = Object.keys(parsed);
    for (const k of keys) {
      if (process.env[k] === undefined) {
        process.env[k] = parsed[k];
      }
    }
    console.log(`[env] Manual parse loaded ${keys.length} keys: ${keys.join(', ')}`);
  } catch (e) {
    console.warn('[env] Manual .env parse failed:', e?.message || e);
  }
}
// Normalize flag once and reuse everywhere
const USE_JSON = String(process.env.USE_JSON_DATA || '').toLowerCase() === 'true';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize learning path service
const learningPathService = new LearningPathService();

// Mongo connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'internship_recommendation';
const COLLECTION = 'internships';

let db, internshipsCol;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  internshipsCol = db.collection(COLLECTION);
  console.log('Connected to MongoDB');
}

// Lightweight skill graph relationships
const skillGraph = {
  html: ['css', 'javascript'],
  css: ['html', 'javascript'],
  javascript: ['html', 'css', 'react', 'node.js', 'typescript'],
  react: ['javascript', 'redux', 'node.js'],
  'node.js': ['javascript', 'express', 'mongodb'],
  express: ['node.js', 'javascript'],
  mongodb: ['node.js', 'express', 'sql'],
  sql: ['databases', 'mysql', 'postgresql'],
  python: ['pandas', 'numpy', 'machine learning', 'flask', 'django'],
  'machine learning': ['python', 'data science', 'deep learning'],
  'data science': ['python', 'pandas', 'numpy', 'machine learning'],
  'deep learning': ['python', 'pytorch', 'tensorflow'],
  django: ['python'],
  flask: ['python'],
  pandas: ['python', 'data science'],
  numpy: ['python', 'data science'],
  typescript: ['javascript'],
};

function normalizeSkill(s) {
  return (s || '').toString().trim().toLowerCase();
}

function getRelatedSkills(skills) {
  const related = new Set();
  for (const s of skills) {
    const rel = skillGraph[normalizeSkill(s)] || [];
    rel.forEach(r => related.add(r));
  }
  return related;
}

// Enhanced scoring function with skill-first approach, narrative diversity, and bias mitigation
function scoreInternship(user, intern, preferences = null, biasMitigation = true) {
  const reasons = [];
  let score = 0;

  const userEducation = (user.education || '').toLowerCase();
  const userDept = (user.department || '').toLowerCase();
  const userSector = (user.sector || '').toLowerCase();
  const userLocation = (user.location || '').toLowerCase();
  const userSkills = new Set((user.skills || []).map(normalizeSkill));

  const iEducation = (intern.education || '').toLowerCase();
  const iDept = (intern.department || '').toLowerCase();
  const iSector = (intern.sector || '').toLowerCase();
  const iLocation = (intern.location || '').toLowerCase();
  const iSkills = new Set((intern.skills || []).map(normalizeSkill));

  // Skill overlap: CRITICAL - Primary filter
  const matchingSkills = [...iSkills].filter(s => userSkills.has(s));
  const missingSkills = [...iSkills].filter(s => !userSkills.has(s));
  const relatedSkills = [...iSkills].filter(s => getRelatedSkills(user.skills || []).has(s));

  // SKILL-FIRST APPROACH: No skill match = very low score (avoid skill mismatch)
  if (matchingSkills.length === 0 && relatedSkills.length === 0) {
    // Only recommend if there's strong education/department/sector match
    if (userEducation === iEducation && userDept === iDept && userSector === iSector) {
      score += 1; // Minimal score for perfect non-skill match
      reasons.push(`Perfect education/department/sector match despite skill gap`);
    } else {
      return { score: 0, reasons: [], narratives: [], category: 'no_match', matchingSkills, missingSkills, relatedSkills };
    }
  }

  // Apply user preferences or use defaults
  const weights = preferences || {
    skills: 3,
    education: 2,
    department: 2,
    sector: 2,
    location: 1,
    stipend: 1
  };

  // Skill scoring: Exact matches get highest priority
  if (matchingSkills.length > 0) {
    score += matchingSkills.length * weights.skills;
    reasons.push(`Skill match: ${matchingSkills.join(', ')}`);
  }
  
  // Related skills: Secondary but important
  if (relatedSkills.length > 0) {
    score += Math.min(relatedSkills.length * Math.max(1, weights.skills - 1), matchingSkills.length * Math.max(1, weights.skills - 1));
    reasons.push(`Related skills: ${relatedSkills.join(', ')}`);
  }

  // Education/Department/Sector: Important but secondary to skills
  if (userEducation && userEducation === iEducation) {
    score += weights.education;
    reasons.push(`Education matches: ${intern.education}`);
  }
  if (userDept && userDept === iDept) {
    score += weights.department;
    reasons.push(`Department matches: ${intern.department}`);
  }
  if (userSector && userSector === iSector) {
    score += weights.sector;
    reasons.push(`Sector matches: ${intern.sector}`);
  }

  // Location: Tie-breaker only if skills exist
  if ((matchingSkills.length > 0 || relatedSkills.length > 0) && userLocation && userLocation === iLocation) {
    score += weights.location;
    reasons.push(`Location matches: ${intern.location}`);
  }

  // Stipend consideration (bonus for good stipend)
  const stipend = parseInt(intern.stipend) || 0;
  if (stipend >= 20000) {
    score += weights.stipend;
    reasons.push(`Competitive stipend: ₹${stipend}`);
  }

  // Bias Mitigation: Boost rural and diverse opportunities
  if (biasMitigation) {
    const isRuralLocation = ['Coimbatore', 'Indore', 'Jaipur', 'Bhubaneswar', 'Kochi'].includes(intern.location);
    const isDiverseSector = ['Agriculture', 'Healthcare', 'Education'].includes(intern.sector);
    
    if (isRuralLocation) {
      score += 1;
      reasons.push(`Rural opportunity boost: ${intern.location}`);
    }
    if (isDiverseSector) {
      score += 1;
      reasons.push(`Diverse sector boost: ${intern.sector}`);
    }
  }

  // Opportunity gap: Growth potential roles
  const opportunityGap = missingSkills.length > 0 && missingSkills.length <= 2 && (matchingSkills.length >= 1 || userSector === iSector || userDept === iDept);
  if (opportunityGap) {
    score += 1;
    const gapText = missingSkills.join(', ');
    reasons.push(`Growth potential: add ${gapText} to qualify fully`);
  }

  // Concise narrative generation for SIH25034
  const narratives = [];
  
  // Skill-based narratives (crisp and short)
  if (matchingSkills.length >= 3) {
    narratives.push(`Strong skill match: ${matchingSkills.slice(0, 3).join(', ')}`);
  } else if (matchingSkills.length === 2) {
    narratives.push(`Good skill match: ${matchingSkills.join(', ')}`);
  } else if (matchingSkills.length === 1) {
    narratives.push(`Skill match: ${matchingSkills[0]}`);
  }
  
  // Related skills narrative
  if (relatedSkills.length > 0) {
    narratives.push(`Related skills: ${relatedSkills.slice(0, 2).join(', ')}`);
  }
  
  // Education/Department narratives
  if (userEducation === iEducation) {
    narratives.push(`Education match: ${intern.education}`);
  }
  if (userDept === iDept) {
    narratives.push(`Department match: ${intern.department}`);
  }
  
  // Sector narratives
  if (userSector === iSector) {
    narratives.push(`Sector match: ${intern.sector}`);
  }
  
  // Location narratives
  if (userLocation === iLocation && (matchingSkills.length > 0 || relatedSkills.length > 0)) {
    narratives.push(`Location match: ${intern.location}`);
  }
  
  // Stipend narratives
  if (stipend >= 25000) {
    narratives.push(`High stipend: ₹${stipend}`);
  } else if (stipend >= 15000) {
    narratives.push(`Good stipend: ₹${stipend}`);
  }
  
  // Growth opportunity narratives
  if (opportunityGap) {
    narratives.push(`Growth potential: Learn ${missingSkills.slice(0, 2).join(', ')}`);
  }

  // Enhanced category classification
  let category = 'alternative';
  if (matchingSkills.length >= 3 || (matchingSkills.length >= 2 && relatedSkills.length >= 1)) {
    category = 'best_fit';
  } else if (opportunityGap || (matchingSkills.length >= 1 && relatedSkills.length >= 2)) {
    category = 'growth';
  } else if (matchingSkills.length >= 1 || relatedSkills.length >= 2) {
    category = 'best_fit';
  } else if (userEducation === iEducation && userDept === iDept && userSector === iSector) {
    category = 'alternative';
  }

  // Detailed scoring breakdown for explainable AI
  const scoringBreakdown = {
    skillMatch: {
      points: matchingSkills.length * 3,
      details: matchingSkills.length > 0 ? `+${matchingSkills.length * 3} for exact skill matches: ${matchingSkills.join(', ')}` : 'No exact skill matches'
    },
    relatedSkills: {
      points: Math.min(relatedSkills.length * 2, matchingSkills.length * 2),
      details: relatedSkills.length > 0 ? `+${Math.min(relatedSkills.length * 2, matchingSkills.length * 2)} for related skills: ${relatedSkills.slice(0, 2).join(', ')}` : 'No related skills'
    },
    education: {
      points: userEducation === iEducation ? 2 : 0,
      details: userEducation === iEducation ? `+2 for education match: ${intern.education}` : 'No education match'
    },
    department: {
      points: userDept === iDept ? 2 : 0,
      details: userDept === iDept ? `+2 for department match: ${intern.department}` : 'No department match'
    },
    sector: {
      points: userSector === iSector ? 2 : 0,
      details: userSector === iSector ? `+2 for sector match: ${intern.sector}` : 'No sector match'
    },
    location: {
      points: (userLocation === iLocation && (matchingSkills.length > 0 || relatedSkills.length > 0)) ? 1 : 0,
      details: (userLocation === iLocation && (matchingSkills.length > 0 || relatedSkills.length > 0)) ? `+1 for location match: ${intern.location}` : 'No location match'
    },
    stipend: {
      points: stipend >= 20000 ? 1 : 0,
      details: stipend >= 20000 ? `+1 for competitive stipend: ₹${stipend}` : 'Standard stipend'
    },
    growthPotential: {
      points: opportunityGap ? 1 : 0,
      details: opportunityGap ? `+1 for growth potential: Learn ${missingSkills.slice(0, 2).join(', ')}` : 'No growth opportunity'
    }
  };

  return { score, reasons, narratives, category, matchingSkills, missingSkills, relatedSkills, scoringBreakdown };
}

// Learning path generator for no-match scenarios
function generateLearningPaths(user) {
  const learningPaths = [];
  const userSkills = (user.skills || []).map(normalizeSkill);
  const userSector = (user.sector || '').toLowerCase();
  const userEducation = (user.education || '').toLowerCase();

  // Technology sector learning paths
  if (userSector === 'technology' || userEducation.includes('tech')) {
    if (!userSkills.includes('python')) {
      learningPaths.push({
        title: "Python Programming Fundamentals",
        description: "Learn Python basics to qualify for most tech internships",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        skills: ["Python", "Programming Logic", "Data Structures"],
        resources: ["Python.org tutorial", "Codecademy Python course", "FreeCodeCamp Python"]
      });
    }
    if (!userSkills.includes('javascript')) {
      learningPaths.push({
        title: "JavaScript & Web Development",
        description: "Master JavaScript for frontend and backend development",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        skills: ["JavaScript", "HTML", "CSS", "React"],
        resources: ["MDN Web Docs", "JavaScript.info", "React documentation"]
      });
    }
    if (!userSkills.includes('sql')) {
      learningPaths.push({
        title: "SQL & Database Management",
        description: "Learn SQL for data analysis and backend development",
        duration: "3-4 weeks",
        difficulty: "Beginner",
        skills: ["SQL", "Database Design", "Data Analysis"],
        resources: ["W3Schools SQL", "SQLBolt", "Khan Academy SQL"]
      });
    }
  }

  // Business sector learning paths
  if (userSector === 'marketing' || userSector === 'business') {
    if (!userSkills.includes('digital marketing')) {
      learningPaths.push({
        title: "Digital Marketing Fundamentals",
        description: "Learn digital marketing strategies and tools",
        duration: "4-5 weeks",
        difficulty: "Beginner",
        skills: ["Digital Marketing", "SEO", "Social Media Marketing"],
        resources: ["Google Digital Marketing Course", "HubSpot Academy", "Coursera Digital Marketing"]
      });
    }
    if (!userSkills.includes('excel')) {
      learningPaths.push({
        title: "Excel & Data Analysis",
        description: "Master Excel for business analysis and reporting",
        duration: "3-4 weeks",
        difficulty: "Beginner",
        skills: ["Excel", "Data Analysis", "Pivot Tables"],
        resources: ["Microsoft Excel Help", "ExcelJet", "Chandoo.org"]
      });
    }
  }

  // Finance sector learning paths
  if (userSector === 'finance') {
    if (!userSkills.includes('financial analysis')) {
      learningPaths.push({
        title: "Financial Analysis & Modeling",
        description: "Learn financial analysis techniques and Excel modeling",
        duration: "5-6 weeks",
        difficulty: "Intermediate",
        skills: ["Financial Analysis", "Excel", "Financial Modeling"],
        resources: ["CFI Financial Modeling", "Wall Street Prep", "Investopedia"]
      });
    }
  }

  // Design sector learning paths
  if (userSector === 'design') {
    if (!userSkills.includes('figma')) {
      learningPaths.push({
        title: "UI/UX Design with Figma",
        description: "Learn design principles and Figma for UI/UX work",
        duration: "4-5 weeks",
        difficulty: "Beginner",
        skills: ["Figma", "UI Design", "UX Research"],
        resources: ["Figma Academy", "Design+Code", "UX Mastery"]
      });
    }
  }

  // General skill learning paths
  if (!userSkills.includes('project management')) {
    learningPaths.push({
      title: "Project Management Fundamentals",
      description: "Learn project management principles and tools",
      duration: "3-4 weeks",
      difficulty: "Beginner",
      skills: ["Project Management", "Agile", "Team Collaboration"],
      resources: ["PMI Learning", "Coursera Project Management", "Asana Academy"]
    });
  }

  return learningPaths.slice(0, 3); // Return top 3 learning paths
}

// POST /recommend
app.post('/recommend', async (req, res) => {
  try {
    const { preferences, biasMitigation = true, ...user } = req.body || {};
    let docs = [];

    // Check if we should use JSON data or MongoDB
    if (USE_JSON) {
      console.log('📄 Using JSON data for recommendations');
      docs = getAllInternships();
    } else {
      console.log('🗄️ Using MongoDB for recommendations');
      docs = await internshipsCol.find({}, { projection: { _id: 0 } }).toArray();
    }

    const enriched = docs.map(doc => {
      const { score, reasons, narratives, category, matchingSkills, missingSkills, relatedSkills, scoringBreakdown } = scoreInternship(user, doc, preferences, biasMitigation);
      return { ...doc, score, reasons, narratives, category, matchingSkills, missingSkills, relatedSkills, scoringBreakdown };
    });

    // Hide zero-score
    const filtered = enriched.filter(e => e.score > 0);

    // Sort primarily by score, tie-breakers: matching skills desc, location match last
    filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aMatch = (a.matchingSkills || []).length;
      const bMatch = (b.matchingSkills || []).length;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return 0;
    });

    // Categorize
    const best_fit = filtered.filter(e => e.category === 'best_fit').slice(0, 10);
    const growth = filtered.filter(e => e.category === 'growth').slice(0, 10);
    const alternative = filtered.filter(e => e.category === 'alternative').slice(0, 10);

    // Generate learning paths if no good matches using Grok API
    if (best_fit.length === 0 && growth.length === 0) {
      try {
        // Add language parameter to user profile for learning path generation
        const userWithLanguage = { ...user, language: user.language || 'en' };
        const learningPathResponse = await learningPathService.generateLearningPath(userWithLanguage);
        return res.json(learningPathResponse);
      } catch (error) {
        console.error('Learning path generation failed:', error);
        // Fallback to original learning paths if Grok API fails
        const learningPaths = generateLearningPaths(user);
        return res.json({ 
          status: 'no_matches',
          message: 'No direct internship matches found. Here are some learning suggestions.',
          learning_path: learningPaths.map((path, index) => ({
            step: index + 1,
            skill: path.title,
            resource: path.resources[0] || 'Online course',
            description: path.description,
            duration: path.duration,
            difficulty: path.difficulty
          }))
        });
      }
    }

    res.json({ best_fit, growth, alternative });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /chat_with_card - Chat with internship using Groq API
app.post('/chat_with_card', async (req, res) => {
  try {
    const { internshipId, question, language = 'en' } = req.body;

    if (!internshipId || !question) {
      return res.status(400).json({ error: 'internshipId and question are required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Find the internship by ID
    let internship;
    if (USE_JSON) {
      internship = getById(internshipId);
    } else {
      // For MongoDB mode, we'd need to implement this
      return res.status(500).json({ error: 'Chat feature only available in JSON mode' });
    }

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Language mapping for Groq API
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

    // Build the prompt with internship details
    const skillsList = Array.isArray(internship.skills) ? internship.skills.join(', ') : 'N/A';
    const prompt = `You are an AI assistant helping students learn about internship opportunities. Here are the details of the internship they're asking about:

**Internship Details:**
- Title: ${internship.title}
- Company: ${internship.company}
- Education Required: ${internship.education}
- Department: ${internship.department}
- Sector: ${internship.sector}
- Location: ${internship.location}
- Skills Required: ${skillsList}
- Duration: ${internship.duration}
- Stipend: ₹${internship.stipend}
- Description: ${internship.description}

**Student's Question:** ${question}

Please provide a helpful, informative, and encouraging response about this internship opportunity. 

IMPORTANT: 
- Answer in ${targetLanguage} in a concise and user-friendly way.
- Be short, clear, and precise. Answer in 2-3 sentences maximum. 
- Focus on: 1) Directly answering their question, 2) One key insight about the internship, 3) Brief practical advice
- Keep it concise and actionable.`;

    // Call Groq API
    // Default to a currently supported Groq model; override via GROQ_MODEL if needed
    const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Be short, clear, and precise. Reply in the user\'s requested language.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    let data;
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Groq API error:', response.status, response.statusText, errorText);
      // Graceful fallback instead of 500 so UI keeps working
      const safeSkills = Array.isArray(internship.skills) ? internship.skills.slice(0,3).join(', ') : 'N/A';
      const fallback = `This role focuses on ${internship.title} at ${internship.company}. Key skills: ${safeSkills}. Good match if your interests align.`;
      return res.json({ answer: fallback });
    } else {
      data = await response.json();
    }
    let answer = data?.choices?.[0]?.message?.content || '';

    if (!answer || !answer.trim()) {
      const fallbackByLang = {
        English: 'Sorry, I could not generate a response right now. Please try rephrasing your question.',
        Hindi: 'क्षमा करें, इस समय उत्तर नहीं दे सका। कृपया अपना प्रश्न दोबारा पूछें।',
        Tamil: 'மன்னிக்கவும், இப்போது பதிலை உருவாக்க முடியவில்லை. தயவு செய்து மீண்டும் கேளுங்கள்.',
        Telugu: 'క్షమించండి, ఇప్పుడు స్పందన ఇవ్వలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
        Kannada: 'ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರ ನೀಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
        Malayalam: 'ക്ഷമിക്കണം, ഇപ്പോള്‍ മറുപടി നല്‍കാനായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
        Bengali: 'দুঃখিত, এখন উত্তর দেওয়া সম্ভব নয়। দয়া করে আবার চেষ্টা করুন।',
        Gujarati: 'માફ કરશો, હાલમાં જવાબ આપી શકાતો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
        Marathi: 'क्षमस्व, सध्या उत्तर देऊ शकलो नाही. कृपया पुन्हा प्रयत्न करा.',
        Punjabi: 'ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਸਮੇਂ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
        Odia: 'ଦୁଃଖିତ, ବର୍ତ୍ତମାନ ଉତ୍ତର ଦେଇପାରିଲି ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
        Assamese: 'ক্ষমা কৰিব, এই সময়ত উত্তৰ দিব নোৱাৰিলোঁ। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।',
        Urdu: 'معذرت، اس وقت جواب نہیں دے سکا۔ براہ کرم دوبارہ کوشش کریں۔'
      };
      answer = fallbackByLang[targetLanguage] || fallbackByLang['English'];
    }

    res.json({ answer });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    // Graceful fallback on unexpected exceptions
    try {
      const safeSkills = Array.isArray(internship?.skills) ? internship.skills.slice(0,2).join(', ') : 'relevant skills';
      const fallback = `Here are quick insights: ${internship?.title || 'the internship'} requires ${safeSkills}. Consider applying if it matches your goals.`;
      return res.json({ answer: fallback });
    } catch (_) {
      return res.json({ answer: 'Sorry, I could not generate a response right now. Please try again later.' });
    }
  }
});

// Autocomplete endpoints (skills, sector, location, education, department)
async function distinctLike(field, query) {
  if (!query || query.length < 1) return [];
  
  // Use JSON data if enabled
  if (USE_JSON) {
    return getDistinctValues(field, query);
  }
  
  // Use MongoDB aggregation
  const pipeline = [
    { $match: { [field]: { $exists: true } } },
    { $group: { _id: `$${field}` } },
  ];
  const results = await internshipsCol.aggregate(pipeline).toArray();
  const values = results.map(r => r._id).filter(Boolean);
  const flat = Array.isArray(values[0]) ? [...new Set(values.flat().map(v => v.toString()))] : values.map(v => v.toString());
  return flat.filter(v => v.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
}

app.get('/autocomplete/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const q = (req.query.q || '').toString();
    let field;
    if (type === 'skills') field = 'skills';
    else if (type === 'sector') field = 'sector';
    else if (type === 'location') field = 'location';
    else if (type === 'education') field = 'education';
    else if (type === 'department') field = 'department';
    else return res.json([]);

    const data = await distinctLike(field, q);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

const PORT = process.env.PORT || 4000;

// Only connect to MongoDB if not using JSON data
console.log(`Startup mode: ${USE_JSON ? 'JSON' : 'MongoDB'} (USE_JSON_DATA='${process.env.USE_JSON_DATA}')`);
if (USE_JSON) {
  console.log('📄 Starting server with JSON data mode');
  app.listen(PORT, () => console.log(`Node backend listening on :${PORT} (JSON mode)`));
} else {
  console.log('🗄️ Starting server with MongoDB mode');
  connectMongo().then(() => {
    app.listen(PORT, () => console.log(`Node backend listening on :${PORT} (MongoDB mode)`));
  });
}


