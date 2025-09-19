import React, { useState } from 'react';

const ExplainableScoring = ({ scoringBreakdown, totalScore, language = 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scoringBreakdown) return null;

  const translations = {
    en: {
      scoringBreakdown: "Scoring Breakdown",
      totalScore: "Total Score",
      showDetails: "Show Details",
      hideDetails: "Hide Details",
      skillMatch: "Skill Match",
      relatedSkills: "Related Skills",
      education: "Education",
      department: "Department",
      sector: "Sector",
      location: "Location",
      stipend: "Stipend",
      growthPotential: "Growth Potential"
    },
    hi: {
      scoringBreakdown: "स्कोरिंग विवरण",
      totalScore: "कुल स्कोर",
      showDetails: "विवरण दिखाएं",
      hideDetails: "विवरण छुपाएं",
      skillMatch: "कौशल मेल",
      relatedSkills: "संबंधित कौशल",
      education: "शिक्षा",
      department: "विभाग",
      sector: "क्षेत्र",
      location: "स्थान",
      stipend: "वजीफा",
      growthPotential: "विकास क्षमता"
    }
  };

  const t = translations[language] || translations.en;

  const scoreItems = [
    { key: 'skillMatch', label: t.skillMatch, color: 'bg-blue-100 text-blue-800' },
    { key: 'relatedSkills', label: t.relatedSkills, color: 'bg-green-100 text-green-800' },
    { key: 'education', label: t.education, color: 'bg-purple-100 text-purple-800' },
    { key: 'department', label: t.department, color: 'bg-indigo-100 text-indigo-800' },
    { key: 'sector', label: t.sector, color: 'bg-pink-100 text-pink-800' },
    { key: 'location', label: t.location, color: 'bg-yellow-100 text-yellow-800' },
    { key: 'stipend', label: t.stipend, color: 'bg-emerald-100 text-emerald-800' },
    { key: 'growthPotential', label: t.growthPotential, color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">📊</span>
          {t.scoringBreakdown}
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{t.totalScore}:</span>
          <span className="font-bold text-lg text-blue-600">{totalScore}</span>
        </div>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {scoreItems.map((item) => {
          const scoreData = scoringBreakdown[item.key];
          return (
            <div key={item.key} className={`px-2 py-1 rounded text-xs font-medium ${item.color}`}>
              {item.label}: +{scoreData.points}
            </div>
          );
        })}
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center justify-between"
      >
        <span>{isExpanded ? t.hideDetails : t.showDetails}</span>
        <span className="transform transition-transform duration-200">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {scoreItems.map((item) => {
            const scoreData = scoringBreakdown[item.key];
            if (scoreData.points === 0) return null;
            
            return (
              <div key={item.key} className="flex items-start space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${item.color} flex-shrink-0`}>
                  +{scoreData.points}
                </span>
                <span className="text-sm text-gray-700">{scoreData.details}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExplainableScoring;
