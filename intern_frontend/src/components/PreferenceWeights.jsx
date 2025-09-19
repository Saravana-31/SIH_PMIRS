import React, { useState } from 'react';

const PreferenceWeights = ({ preferences, onPreferencesChange, language = 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const translations = {
    en: {
      preferenceWeights: "Preference Weights",
      customizePriorities: "Customize Priorities",
      skills: "Skills",
      education: "Education",
      department: "Department",
      sector: "Sector",
      location: "Location",
      stipend: "Stipend",
      reset: "Reset to Default",
      apply: "Apply Preferences"
    },
    hi: {
      preferenceWeights: "प्राथमिकता वजन",
      customizePriorities: "प्राथमिकताएं अनुकूलित करें",
      skills: "कौशल",
      education: "शिक्षा",
      department: "विभाग",
      sector: "क्षेत्र",
      location: "स्थान",
      stipend: "वजीफा",
      reset: "डिफ़ॉल्ट पर रीसेट करें",
      apply: "प्राथमिकताएं लागू करें"
    }
  };

  const t = translations[language] || translations.en;

  const defaultPreferences = {
    skills: 3,
    education: 2,
    department: 2,
    sector: 2,
    location: 1,
    stipend: 1
  };

  const [localPreferences, setLocalPreferences] = useState(preferences || defaultPreferences);

  const handleWeightChange = (key, value) => {
    const newPreferences = { ...localPreferences, [key]: parseInt(value) };
    setLocalPreferences(newPreferences);
  };

  const handleReset = () => {
    setLocalPreferences(defaultPreferences);
  };

  const handleApply = () => {
    onPreferencesChange(localPreferences);
    setIsExpanded(false);
  };

  const weightOptions = [
    { value: 0, label: 'Ignore' },
    { value: 1, label: 'Low' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'High' },
    { value: 4, label: 'Critical' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">⚖️</span>
          {t.preferenceWeights}
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Hide' : t.customizePriorities}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(localPreferences).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t[key] || key}
                </label>
                <select
                  value={value}
                  onChange={(e) => handleWeightChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {weightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t.reset}
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.apply}
            </button>
          </div>
        </div>
      )}

      {/* Current Priority Display */}
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Current Priority Order:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(localPreferences)
            .sort(([,a], [,b]) => b - a)
            .map(([key, value]) => (
              <span
                key={key}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  value >= 3 ? 'bg-red-100 text-red-800' :
                  value === 2 ? 'bg-yellow-100 text-yellow-800' :
                  value === 1 ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {t[key] || key} ({value})
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PreferenceWeights;
