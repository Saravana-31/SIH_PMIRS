import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import { translations, languageNames } from "./translations";
import MultiTagInput from "./MultiTagInput";
import { predefinedOptions, getDepartmentsForEducation } from "./predefinedOptions";
import ChatBox from "./components/ChatBox";
import ExplainableScoring from "./components/ExplainableScoring";
import PreferenceWeights from "./components/PreferenceWeights";
import ComparisonMode from "./components/ComparisonMode";
import ExportFavorites from "./components/ExportFavorites";
import ProfessionalCarousel from "./components/ProfessionalCarousel";

function App() {
  const [formData, setFormData] = useState({
    education: [],
    department: [],
    sector: [],
    location: [],
    skills: []
  });
  const [results, setResults] = useState({ best_fit: [], growth: [], alternative: [], learningPaths: [] });
  const [filteredResults, setFilteredResults] = useState({ best_fit: [], growth: [], alternative: [], learningPaths: [] });
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minStipend: '',
    maxStipend: '',
    location: '',
    skill: ''
  });
  const [suggestions, setSuggestions] = useState({
    education: [],
    department: [],
    sector: [],
    location: [],
    skills: []
  });
  const [showSuggestions, setShowSuggestions] = useState({
    education: false,
    department: false,
    sector: false,
    location: false,
    skills: false
  });
  const [speechState, setSpeechState] = useState({
    isPlaying: false,
    isPaused: false,
    currentCard: null
  });
  const [speechSettings, setSpeechSettings] = useState({
    rate: 0.8,
    pitch: 1.1,
    volume: 1
  });
  const [chatState, setChatState] = useState({
    isOpen: false,
    selectedInternship: null
  });
  const [preferences, setPreferences] = useState(null);
  const [biasMitigation, setBiasMitigation] = useState(true);
  const [comparisonMode, setComparisonMode] = useState({
    isOpen: false
  });
  const [exportMode, setExportMode] = useState({
    isOpen: false
  });

  const t = translations[language];
  const debounceRefs = useRef({});
  const speechRef = useRef(null);

  // Function to translate recommendation text
  const translateRecommendation = (text) => {
    if (!text) return text;
    
    // Map English patterns to translation keys
    const translationMap = {
      'Strong skill match:': t.strongSkillMatch + ':',
      'Good skill match:': t.goodSkillMatch + ':',
      'Skill match:': t.skillMatch + ':',
      'Related skills:': t.relatedSkills + ':',
      'Education match:': t.educationMatch + ':',
      'Department match:': t.departmentMatch + ':',
      'Sector match:': t.sectorMatch + ':',
      'Location match:': t.locationMatch + ':',
      'High stipend:': t.highStipend + ':',
      'Good stipend:': t.goodStipend + ':',
      'Growth potential:': t.growthPotential + ':'
    };

    let translatedText = text;
    Object.entries(translationMap).forEach(([english, translated]) => {
      translatedText = translatedText.replace(english, translated);
    });
    
    return translatedText;
  };

  // Filter results based on current filters
  useEffect(() => {
    const applyFilters = (items) => {
      return items.filter(item => {
        // Stipend filter
        if (filters.minStipend && parseInt(item.stipend) < parseInt(filters.minStipend)) return false;
        if (filters.maxStipend && parseInt(item.stipend) > parseInt(filters.maxStipend)) return false;
        
        // Location filter
        if (filters.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        
        // Skill filter
        if (filters.skill && !item.skills.some(skill => 
          skill.toLowerCase().includes(filters.skill.toLowerCase())
        )) return false;
        
        return true;
      });
    };

    setFilteredResults({
      best_fit: applyFilters(results.best_fit),
      growth: applyFilters(results.growth),
      alternative: applyFilters(results.alternative),
      learningPaths: results.learningPaths // Learning paths don't need filtering
    });
  }, [results, filters]);

  // Debounced autocomplete function
  const debouncedAutocomplete = (field, query, delay = 300) => {
    if (debounceRefs.current[field]) {
      clearTimeout(debounceRefs.current[field]);
    }
    
    debounceRefs.current[field] = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          const response = await axios.get(`http://localhost:4000/autocomplete/${field}?q=${query}`);
          setSuggestions(prev => ({ ...prev, [field]: response.data }));
        } catch (error) {
          console.error(`Error fetching ${field} suggestions:`, error);
        }
      } else {
        setSuggestions(prev => ({ ...prev, [field]: [] }));
      }
    }, delay);
  };

  const handleTagChange = (field, tags) => {
    setFormData({ ...formData, [field]: tags });
    
    // Handle department suggestions based on education
    if (field === "education" && tags.length > 0) {
      const latestEducation = tags[tags.length - 1];
      const departments = getDepartmentsForEducation(latestEducation);
      setSuggestions(prev => ({ ...prev, department: departments }));
    }
  };

  const handleInputChange = (field, value) => {
    if (["sector", "location", "skills"].includes(field)) {
      debouncedAutocomplete(field, value);
    }
  };

  const handleSuggestionClick = (field, suggestion) => {
    setFormData({ ...formData, [field]: suggestion });
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const submitData = {
      education: formData.education[0] || "",
      department: formData.department[0] || "",
      sector: formData.sector[0] || "",
      location: formData.location[0] || "",
      skills: formData.skills,
      preferences: preferences,
      biasMitigation: biasMitigation
    };
    try {
      // Try Node backend first
      const resNode = await axios.post("http://localhost:4000/recommend", submitData, { timeout: 4000 });
      const data = resNode?.data;
      const hasAny = !!(data && ((data.best_fit && data.best_fit.length) || (data.growth && data.growth.length) || (data.alternative && data.alternative.length)));
      if (hasAny) {
        setResults({
          best_fit: data.best_fit || [],
          growth: data.growth || [],
          alternative: data.alternative || [],
          learningPaths: data.learningPaths || []
        });
        return;
      }
      // Fall through to Flask if empty
    } catch (e) {
      // Ignore and fall back to Flask
    }
    try {
      // Fallback: Flask backend
      const resFlask = await axios.post("http://127.0.0.1:5000/find_internships", submitData, { timeout: 4000 });
      const arr = Array.isArray(resFlask.data) ? resFlask.data : [];
      // Map to categories: treat as best_fit list
      setResults({ best_fit: arr.filter(x => (x && typeof x.score === 'number' ? x.score > 0 : true)), growth: [], alternative: [], learningPaths: [] });
    } catch (error) {
      console.error("Error fetching internships (both backends):", error);
      setResults({ best_fit: [], growth: [], alternative: [], learningPaths: [] });
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text, cardIndex) => {
    if (!('speechSynthesis' in window)) return;

    // If clicking the same card that's currently playing/paused
    if (speechState.currentCard === cardIndex) {
      if (speechState.isPlaying) {
        // Currently playing - pause it
        speechSynthesis.pause();
        setSpeechState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
      } else if (speechState.isPaused) {
        // Currently paused - resume it
        speechSynthesis.resume();
        setSpeechState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      } else {
        // Stopped - start fresh
        startSpeech(text, cardIndex);
      }
    } else {
      // Different card - stop current and start new
      speechSynthesis.cancel();
      startSpeech(text, cardIndex);
    }
  };

  const startSpeech = (text, cardIndex) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Enhanced language mapping with voice selection
    const languageMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
      'or': 'or-IN',
      'as': 'as-IN',
      'ur': 'ur-IN'
    };
    
    utterance.lang = languageMap[language] || 'en-US';
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;

    // Try to select appropriate voice for the language
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang === utterance.lang && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang === utterance.lang
    ) || voices.find(voice => 
      voice.lang.startsWith(utterance.lang.split('-')[0])
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setSpeechState({ isPlaying: true, isPaused: false, currentCard: cardIndex });
    };

    utterance.onend = () => {
      setSpeechState({ isPlaying: false, isPaused: false, currentCard: null });
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeechState({ isPlaying: false, isPaused: false, currentCard: null });
    };

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const openChat = (internship) => {
    setChatState({
      isOpen: true,
      selectedInternship: internship
    });
  };

  const closeChat = () => {
    setChatState({
      isOpen: false,
      selectedInternship: null
    });
  };

  // const InternshipCard = ({ internship, index }) => {
  //   const reasonsOrNarratives = (internship.narratives && internship.narratives.length ? internship.narratives : (internship.reasons || []));
  //   const skillsArray = Array.isArray(internship.skills) ? internship.skills : [];
  //   const cardText = `${t.internshipTitle}: ${internship.title || ''}. ${t.company}: ${internship.company || ''}. ${t.location}: ${internship.location || ''}. ${t.stipend}: ${internship.stipend || ''}. ${t.skills}: ${skillsArray.join(", ")}. ${t.score}: ${internship.score ?? 0}. ${t.whyRecommended}: ${reasonsOrNarratives.join(". ")}`;

  //   const getSpeechButtonIcon = () => {
  //     if (speechState.currentCard === index) {
  //       if (speechState.isPlaying) return "⏸️";
  //       if (speechState.isPaused) return "▶️";
  //     }
  //     return "🔊";
  //   };

  //   return (
  //     <div className="internship-card">
  //       <div className="card-header">
  //         <h3 className="card-title">{internship.title}</h3>
  //         <button 
  //           className="read-button"
  //           onClick={() => speakText(cardText, index)}
  //           title={speechState.currentCard === index && speechState.isPlaying ? "Pause" : speechState.currentCard === index && speechState.isPaused ? "Resume" : t.readAloud}
  //         >
  //           {getSpeechButtonIcon()}
  //         </button>
  const InternshipCard = ({ internship, index }) => {
    const reasonsOrNarratives = (internship.narratives && internship.narratives.length 
      ? internship.narratives 
      : (internship.reasons || []));
    const skillsArray = Array.isArray(internship.skills) ? internship.skills : [];
  
    // Build card text in selected language with translated recommendations
    const translatedReasons = reasonsOrNarratives.map(reason => translateRecommendation(reason));
    const cardText = `
      ${t.internshipTitle}: ${internship.title || ''}.
      ${t.company}: ${internship.company || ''}.
      ${t.location}: ${internship.location || ''}.
      ${t.stipend}: ${internship.stipend || ''}.
      ${t.skills}: ${skillsArray.join(", ")}.
      ${t.score}: ${internship.score ?? 0}.
      ${t.whyRecommended}: ${translatedReasons.join(". ")}
    `;
  
    const getSpeechButtonIcon = () => {
      if (speechState.currentCard === index) {
        if (speechState.isPlaying) return "⏸️";
        if (speechState.isPaused) return "▶️";
      }
      return "🔊";
    };
  
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900 leading-tight">{internship.title}</h3>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors duration-200 text-green-600"
              onClick={() => openChat(internship)}
              title="Chat about this internship"
            >
              <span className="text-lg">💬</span>
            </button>
            <button
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-blue-600"
              onClick={() => speakText(cardText, index)}
              title={speechState.currentCard === index && speechState.isPlaying ? "Pause" : speechState.currentCard === index && speechState.isPaused ? "Resume" : t.readAloud}
            >
              <span className="text-lg">{getSpeechButtonIcon()}</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">{t.company}:</span>
            <span className="text-sm text-gray-900 font-medium">{internship.company}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">{t.location}:</span>
            <span className="text-sm text-gray-900">{internship.location}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">{t.stipend}:</span>
            <span className="text-sm text-green-600 font-semibold">₹{internship.stipend}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">{t.skills}:</span>
            <div className="flex flex-wrap gap-1 max-w-xs">
              {skillsArray.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">{t.score}:</span>
            <span className="text-sm text-purple-600 font-semibold">{internship.score}</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">{t.whyRecommended}</h4>
            <ul className="space-y-1">
              {reasonsOrNarratives.map((reason, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✔</span>
                  <span>{translateRecommendation(reason)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explainable Scoring */}
          {internship.scoringBreakdown && (
            <div className="mt-4">
              <ExplainableScoring 
                scoringBreakdown={internship.scoringBreakdown}
                totalScore={internship.score}
                language={language}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const LearningPathCard = ({ learningPath, index }) => {
    const cardText = `
      Learning Path: ${learningPath.title}.
      Description: ${learningPath.description}.
      Duration: ${learningPath.duration}.
      Difficulty: ${learningPath.difficulty}.
      Skills to learn: ${learningPath.skills.join(", ")}.
      Resources: ${learningPath.resources.join(", ")}
    `;

    const getSpeechButtonIcon = () => {
      if (speechState.currentCard === `learning-${index}`) {
        if (speechState.isPlaying) return "⏸️";
        if (speechState.isPaused) return "▶️";
      }
      return "🔊";
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-purple-900 leading-tight">{learningPath.title}</h3>
          <button
            className="ml-4 p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors duration-200 text-purple-600"
            onClick={() => speakText(cardText, `learning-${index}`)}
            title={speechState.currentCard === `learning-${index}` && speechState.isPlaying ? "Pause" : speechState.currentCard === `learning-${index}` && speechState.isPaused ? "Resume" : t.readAloud}
          >
            <span className="text-lg">{getSpeechButtonIcon()}</span>
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-700 text-sm leading-relaxed">{learningPath.description}</p>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Duration:</span>
            <span className="text-sm text-purple-600 font-medium">{learningPath.duration}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Difficulty:</span>
            <span className="text-sm text-orange-600 font-medium">{learningPath.difficulty}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">Skills:</span>
            <div className="flex flex-wrap gap-1 max-w-xs">
              {learningPath.skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-purple-200">
            <h4 className="text-sm font-semibold text-purple-800 mb-2">Resources:</h4>
            <ul className="space-y-1">
              {learningPath.resources.map((resource, idx) => (
                <li key={idx} className="text-sm text-purple-700 flex items-start">
                  <span className="text-purple-500 mr-2 mt-0.5">📚</span>
                  <span>{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-lg">🇮🇳</span>
              <span className="font-medium">भारत सरकार / Government Of India</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">👍</span>
                <span className="text-gray-300">🔊</span>
              </div>
              <select className="bg-transparent text-white border border-white border-opacity-30 rounded px-2 py-1 text-sm">
                <option className="bg-blue-900">English</option>
                <option className="bg-blue-900">Hindi</option>
              </select>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Screen Reader</a>
              <div className="flex items-center space-x-2">
                <button className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded">A-</button>
                <button className="text-white text-xs px-2 py-1 rounded bg-white bg-opacity-20">A</button>
                <button className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded">A+</button>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Youth Registration
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">🏛️</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">PM Internship Portal</div>
                  <div className="text-sm text-gray-600">Ministry of Corporate Affairs, Government of India</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">{t.selectLanguage}:</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🔊</span>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Rate:</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechSettings.rate}
                      onChange={(e) => setSpeechSettings({...speechSettings, rate: parseFloat(e.target.value)})}
                      className="w-16"
                    />
                    <span className="text-xs text-gray-600 w-8">{speechSettings.rate.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Pitch:</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechSettings.pitch}
                      onChange={(e) => setSpeechSettings({...speechSettings, pitch: parseFloat(e.target.value)})}
                      className="w-16"
                    />
                    <span className="text-xs text-gray-600 w-8">{speechSettings.pitch.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Professional Navigation */}
          <nav className="mt-6 flex space-x-8 border-t border-gray-100 pt-4">
            <a href="#" className="text-blue-600 font-semibold text-sm hover:text-blue-800 border-b-2 border-blue-600 pb-1">HOME</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm flex items-center transition-colors">
              GUIDELINES
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">GALLERY</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">ELIGIBILITY</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">MOBILE APP</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm flex items-center transition-colors">
              SUPPORT
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">COMPENDIUM</a>
          </nav>
        </div>
      </header>

      {/* Professional Alert Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Internship Screening & Selection Ongoing!</span> Check your dashboard, email, and SMS regularly. 
                Confirm joining via the Internship tile on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfessionalCarousel />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Search Section */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Internship</h2>
            <p className="text-lg text-gray-600">Discover opportunities tailored to your skills and career goals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MultiTagInput
              label={t.education}
              placeholder={t.selectEducation}
              value={formData.education}
              onChange={(tags) => handleTagChange('education', tags)}
              suggestions={suggestions.education}
              preDefinedOptions={predefinedOptions.education}
            />

            <MultiTagInput
              label={t.department}
              placeholder={t.selectDepartment}
              value={formData.department}
              onChange={(tags) => handleTagChange('department', tags)}
              suggestions={suggestions.department}
              preDefinedOptions={getDepartmentsForEducation(formData.education[formData.education.length - 1])}
            />

            <MultiTagInput
              label={t.sector}
              placeholder={t.selectSector}
              value={formData.sector}
              onChange={(tags) => handleTagChange('sector', tags)}
              suggestions={suggestions.sector}
              preDefinedOptions={predefinedOptions.sectors}
              onInputChange={(value) => handleInputChange('sector', value)}
            />

            <MultiTagInput
              label={t.location}
              placeholder={t.selectLocation}
              value={formData.location}
              onChange={(tags) => handleTagChange('location', tags)}
              suggestions={suggestions.location}
              preDefinedOptions={predefinedOptions.locations}
              onInputChange={(value) => handleInputChange('location', value)}
            />

            <MultiTagInput
              label={t.skills}
              placeholder={t.enterSkills}
              value={formData.skills}
              onChange={(tags) => handleTagChange('skills', tags)}
              suggestions={suggestions.skills}
              preDefinedOptions={predefinedOptions.skills}
              onInputChange={(value) => handleInputChange('skills', value)}
            />

            <div className="flex items-end">
              <button 
                onClick={handleSubmit} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t.loading}
                  </div>
                ) : (
                  t.submit
                )}
              </button>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="mt-6 space-y-4">
            <PreferenceWeights 
              preferences={preferences} 
              onPreferencesChange={setPreferences}
              language={language}
            />
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={biasMitigation}
                  onChange={(e) => setBiasMitigation(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🎯 Enable Bias Mitigation (Show diverse opportunities)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Professional Action Buttons */}
        {(results?.best_fit?.length > 0 || results?.growth?.length > 0 || results?.alternative?.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Take Action</h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setComparisonMode({ isOpen: true })}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare Internships
                </button>
                <button
                  onClick={() => setExportMode({ isOpen: true })}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {(results?.best_fit?.length > 0 || results?.growth?.length > 0 || results?.alternative?.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stipend (₹)</label>
                <input
                  type="number"
                  value={filters.minStipend}
                  onChange={(e) => setFilters({...filters, minStipend: e.target.value})}
                  placeholder="e.g., 15000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Stipend (₹)</label>
                <input
                  type="number"
                  value={filters.maxStipend}
                  onChange={(e) => setFilters({...filters, maxStipend: e.target.value})}
                  placeholder="e.g., 30000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="e.g., Bangalore"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                <input
                  type="text"
                  value={filters.skill}
                  onChange={(e) => setFilters({...filters, skill: e.target.value})}
                  placeholder="e.g., Python"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({minStipend: '', maxStipend: '', location: '', skill: ''})}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-8">
          {(!loading && (!filteredResults?.best_fit?.length && !filteredResults?.growth?.length && !filteredResults?.alternative?.length && !filteredResults?.learningPaths?.length)) ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600">{t.noResults}</p>
            </div>
          ) : (
            <>
              {filteredResults?.learningPaths?.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg mb-4">
                      <span className="text-white text-lg">📚</span>
                    </div>
                    <h2 className="text-3xl font-bold text-purple-900 mb-2">Learning Paths</h2>
                    <p className="text-gray-600">Structured learning journeys to enhance your skills</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.learningPaths.map((learningPath, index) => (
                      <LearningPathCard key={`learning-${index}`} learningPath={learningPath} index={index} />
                    ))}
                  </div>
                </section>
              )}
              
              {filteredResults?.best_fit?.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg mb-4">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <h2 className="text-3xl font-bold text-green-900 mb-2">Best Fit Internships</h2>
                    <p className="text-gray-600">Perfect matches based on your profile ({filteredResults.best_fit.length} opportunities)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.best_fit.map((internship, index) => (
                      <InternshipCard key={`best-${index}`} internship={internship} index={index} />
                    ))}
                  </div>
                </section>
              )}
              
              {filteredResults?.growth?.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg mb-4">
                      <span className="text-white text-lg">🚀</span>
                    </div>
                    <h2 className="text-3xl font-bold text-orange-900 mb-2">Growth Potential</h2>
                    <p className="text-gray-600">High-growth opportunities for career advancement ({filteredResults.growth.length} opportunities)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.growth.map((internship, index) => (
                      <InternshipCard key={`growth-${index}`} internship={internship} index={index} />
                    ))}
                  </div>
                </section>
              )}
              
              {filteredResults?.alternative?.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg mb-4">
                      <span className="text-white text-lg">🌍</span>
                    </div>
                    <h2 className="text-3xl font-bold text-blue-900 mb-2">Alternative Opportunities</h2>
                    <p className="text-gray-600">Explore diverse career paths and opportunities ({filteredResults.alternative.length} opportunities)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.alternative.map((internship, index) => (
                      <InternshipCard key={`alt-${index}`} internship={internship} index={index} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Chat Modal */}
      <ChatBox
        internship={chatState.selectedInternship}
        isOpen={chatState.isOpen}
        onClose={closeChat}
        language={language}
      />

      {/* Comparison Mode Modal */}
      <ComparisonMode
        internships={[...(results.best_fit || []), ...(results.growth || []), ...(results.alternative || [])]}
        isOpen={comparisonMode.isOpen}
        onClose={() => setComparisonMode({ isOpen: false })}
        language={language}
      />

      {/* Export Favorites Modal */}
      <ExportFavorites
        internships={[...(results.best_fit || []), ...(results.growth || []), ...(results.alternative || [])]}
        isOpen={exportMode.isOpen}
        onClose={() => setExportMode({ isOpen: false })}
        language={language}
      />

      {/* Professional Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-xl">🏛️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">PM Internship Portal</h3>
                  <p className="text-gray-400 text-sm">Ministry of Corporate Affairs</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                A government initiative to provide quality internship opportunities and skill development 
                programs for students across India, fostering innovation and career growth.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Guidelines</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Eligibility</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Mobile App</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Partner Organizations</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white bg-opacity-10 rounded-lg px-4 py-3 text-center">
                  <span className="text-sm font-semibold">ADITYA BIRLA</span>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg px-4 py-3 text-center">
                  <span className="text-sm font-semibold">TATA GROUP</span>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg px-4 py-3 text-center">
                  <span className="text-sm font-semibold">RELIANCE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">&copy; 2024 Government of India. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Professional Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
