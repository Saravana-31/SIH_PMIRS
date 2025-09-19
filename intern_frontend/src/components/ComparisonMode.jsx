import React, { useState } from 'react';

const ComparisonMode = ({ internships, isOpen, onClose, language = 'en' }) => {
  const [selectedInternships, setSelectedInternships] = useState([]);

  const translations = {
    en: {
      comparisonMode: "Comparison Mode",
      selectTwoInternships: "Select 2 internships to compare",
      compare: "Compare",
      close: "Close",
      internship1: "Internship 1",
      internship2: "Internship 2",
      title: "Title",
      company: "Company",
      location: "Location",
      stipend: "Stipend",
      duration: "Duration",
      skills: "Skills",
      score: "Score",
      whyRecommended: "Why Recommended",
      advantages: "Advantages",
      considerations: "Considerations"
    },
    hi: {
      comparisonMode: "तुलना मोड",
      selectTwoInternships: "तुलना के लिए 2 इंटर्नशिप चुनें",
      compare: "तुलना करें",
      close: "बंद करें",
      internship1: "इंटर्नशिप 1",
      internship2: "इंटर्नशिप 2",
      title: "शीर्षक",
      company: "कंपनी",
      location: "स्थान",
      stipend: "वजीफा",
      duration: "अवधि",
      skills: "कौशल",
      score: "स्कोर",
      whyRecommended: "क्यों सुझाया गया",
      advantages: "फायदे",
      considerations: "विचार"
    }
  };

  const t = translations[language] || translations.en;

  const handleInternshipSelect = (internship) => {
    if (selectedInternships.length < 2) {
      setSelectedInternships([...selectedInternships, internship]);
    }
  };

  const handleRemoveInternship = (index) => {
    setSelectedInternships(selectedInternships.filter((_, i) => i !== index));
  };

  const getAdvantages = (internship) => {
    const advantages = [];
    if (internship.score >= 8) advantages.push("High match score");
    if (parseInt(internship.stipend) >= 25000) advantages.push("Competitive stipend");
    if (internship.skills && internship.skills.length >= 3) advantages.push("Comprehensive skill set");
    if (internship.location && ['Bangalore', 'Mumbai', 'Delhi'].includes(internship.location)) advantages.push("Metro location");
    return advantages;
  };

  const getConsiderations = (internship) => {
    const considerations = [];
    if (internship.skills && internship.skills.length < 2) considerations.push("Limited skill requirements");
    if (parseInt(internship.stipend) < 15000) considerations.push("Lower stipend");
    if (internship.duration && internship.duration.includes('6')) considerations.push("Long duration");
    return considerations;
  };

  if (!isOpen) return null;

  if (selectedInternships.length === 2) {
    const [intern1, intern2] = selectedInternships;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🔄</span>
              {t.comparisonMode}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Comparison Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Internship 1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-blue-600">{t.internship1}</h4>
                  <button
                    onClick={() => handleRemoveInternship(0)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <div><strong>{t.title}:</strong> {intern1.title}</div>
                  <div><strong>{t.company}:</strong> {intern1.company}</div>
                  <div><strong>{t.location}:</strong> {intern1.location}</div>
                  <div><strong>{t.stipend}:</strong> ₹{intern1.stipend}</div>
                  <div><strong>{t.duration}:</strong> {intern1.duration}</div>
                  <div><strong>{t.skills}:</strong> {intern1.skills?.join(', ')}</div>
                  <div><strong>{t.score}:</strong> {intern1.score}</div>
                  
                  <div>
                    <strong>{t.whyRecommended}:</strong>
                    <ul className="mt-1 space-y-1">
                      {intern1.narratives?.map((reason, idx) => (
                        <li key={idx} className="text-sm">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>{t.advantages}:</strong>
                    <ul className="mt-1 space-y-1">
                      {getAdvantages(intern1).map((advantage, idx) => (
                        <li key={idx} className="text-sm text-green-600">✓ {advantage}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>{t.considerations}:</strong>
                    <ul className="mt-1 space-y-1">
                      {getConsiderations(intern1).map((consideration, idx) => (
                        <li key={idx} className="text-sm text-orange-600">⚠ {consideration}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Internship 2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-green-600">{t.internship2}</h4>
                  <button
                    onClick={() => handleRemoveInternship(1)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <div><strong>{t.title}:</strong> {intern2.title}</div>
                  <div><strong>{t.company}:</strong> {intern2.company}</div>
                  <div><strong>{t.location}:</strong> {intern2.location}</div>
                  <div><strong>{t.stipend}:</strong> ₹{intern2.stipend}</div>
                  <div><strong>{t.duration}:</strong> {intern2.duration}</div>
                  <div><strong>{t.skills}:</strong> {intern2.skills?.join(', ')}</div>
                  <div><strong>{t.score}:</strong> {intern2.score}</div>
                  
                  <div>
                    <strong>{t.whyRecommended}:</strong>
                    <ul className="mt-1 space-y-1">
                      {intern2.narratives?.map((reason, idx) => (
                        <li key={idx} className="text-sm">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>{t.advantages}:</strong>
                    <ul className="mt-1 space-y-1">
                      {getAdvantages(intern2).map((advantage, idx) => (
                        <li key={idx} className="text-sm text-green-600">✓ {advantage}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>{t.considerations}:</strong>
                    <ul className="mt-1 space-y-1">
                      {getConsiderations(intern2).map((consideration, idx) => (
                        <li key={idx} className="text-sm text-orange-600">⚠ {consideration}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🔄</span>
            {t.comparisonMode}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-center text-gray-600 mb-6">{t.selectTwoInternships}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internships.map((internship, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedInternships.includes(internship)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleInternshipSelect(internship)}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{internship.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{internship.company}</p>
                <p className="text-sm text-gray-500">{internship.location} • ₹{internship.stipend}</p>
                <p className="text-sm font-medium text-blue-600 mt-2">Score: {internship.score}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonMode;
