import React from 'react';

// Future-ready improvements placeholders for SIH25034
const FutureFeatures = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Future Enhancements (SIH25034)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Explainable Scoring */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📊 Explainable Scoring</h4>
          <p className="text-sm text-gray-600">
            Show detailed scoring breakdown: +3 for skill match, +2 for education, +1 for location, etc.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>

        {/* User Preference Weights */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">⚖️ Preference Weights</h4>
          <p className="text-sm text-gray-600">
            Allow users to set priorities: Skills > Stipend > Location, etc.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>

        {/* Bias Mitigation */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🎯 Bias Mitigation</h4>
          <p className="text-sm text-gray-600">
            Ensure diversity: Don't overfit to city/sector, show rural opportunities.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>

        {/* Comparison Mode */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🔄 Comparison Mode</h4>
          <p className="text-sm text-gray-600">
            Select 2 internships and compare side-by-side with detailed analysis.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>

        {/* Export Favorites */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📄 Export Favorites</h4>
          <p className="text-sm text-gray-600">
            Download/export favorite internships as PDF with personalized summary.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📈 Analytics Dashboard</h4>
          <p className="text-sm text-gray-600">
            Track application success, skill gaps, and career progression insights.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="text-gray-500">Planned</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> These features are designed to enhance the SIH25034 solution with advanced AI capabilities, 
          fairness mechanisms, and user experience improvements. Implementation priority based on user feedback and impact assessment.
        </p>
      </div>
    </div>
  );
};

export default FutureFeatures;
