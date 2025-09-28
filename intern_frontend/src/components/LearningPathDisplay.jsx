import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const LearningPathDisplay = ({ learningPathData, language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  
  // Use existing translation system
  const t = translations[language] || translations.en;

  // Animation effect for step transitions
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Auto-advance through steps (optional)
  useEffect(() => {
    if (learningPathData?.learning_path?.length > 1) {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % learningPathData.learning_path.length);
      }, 8000); // Change step every 8 seconds
      return () => clearInterval(interval);
    }
  }, [learningPathData]);

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const markStepComplete = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'from-green-500 to-green-600';
      case 'intermediate': return 'from-yellow-500 to-orange-500';
      case 'advanced': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🚀';
      case 'advanced': return '⭐';
      default: return '📚';
    }
  };

  if (!learningPathData?.learning_path?.length) {
    return null;
  }

  const currentStepData = learningPathData.learning_path[currentStep];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl shadow-2xl border border-purple-200 p-8 mb-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-all duration-300">
          <span className="text-white text-3xl">🎓</span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-4">
          {t.learningPathTitle || 'Personalized Learning Path'}
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
          {learningPathData.message || 'No direct internship matches found. Here\'s your personalized learning path.'}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">
            {t.step || 'Step'} {currentStep + 1} {t.of || 'of'} {learningPathData.learning_path.length}
          </span>
          <div className="flex space-x-2">
            {learningPathData.learning_path.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-purple-600 scale-125 shadow-lg'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`${t.goToStep || 'Go to step'} ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / learningPathData.learning_path.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step Display */}
      <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${getDifficultyColor(currentStepData.difficulty)} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white text-xl font-bold">{currentStepData.step}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStepData.skill}
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getDifficultyIcon(currentStepData.difficulty)}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${getDifficultyColor(currentStepData.difficulty)} text-white`}>
                    {currentStepData.difficulty}
                  </span>
                  <span className="text-gray-500 text-sm">⏱️ {currentStepData.duration}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => markStepComplete(currentStep)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                completedSteps.has(currentStep)
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
              }`}
            >
              {completedSteps.has(currentStep) ? '✅ Completed' : '✓ Mark Complete'}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="text-purple-600 mr-2">📖</span>
                {t.description || 'Description'}
              </h4>
              <p className="text-gray-700 leading-relaxed text-lg">
                {currentStepData.description}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="text-blue-600 mr-2">🎯</span>
                {t.resource || 'Resource'}
              </h4>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-blue-800 font-medium text-lg">
                  {currentStepData.resource}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <span>←</span>
          <span>{t.previous || 'Previous'}</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep(0)}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-all duration-300"
          >
            {t.restart || 'Restart'}
          </button>
          <button
            onClick={() => setCurrentStep(learningPathData.learning_path.length - 1)}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-all duration-300"
          >
            {t.finish || 'Finish'}
          </button>
        </div>

        <button
          onClick={() => setCurrentStep(prev => Math.min(learningPathData.learning_path.length - 1, prev + 1))}
          disabled={currentStep === learningPathData.learning_path.length - 1}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <span>{t.next || 'Next'}</span>
          <span>→</span>
        </button>
      </div>

      {/* All Steps Overview */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {t.allSteps || 'All Steps Overview'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningPathData.learning_path.map((step, index) => (
            <div
              key={index}
              onClick={() => handleStepClick(index)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                index === currentStep
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : completedSteps.has(index)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                  completedSteps.has(index)
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-purple-500'
                    : 'bg-gray-400'
                }`}>
                  {completedSteps.has(index) ? '✓' : step.step}
                </div>
                <h4 className="font-semibold text-gray-900 truncate">{step.skill}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{step.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{step.duration}</span>
                <span className={`px-2 py-1 rounded-full ${
                  step.difficulty?.toLowerCase() === 'beginner' ? 'bg-green-100 text-green-700' :
                  step.difficulty?.toLowerCase() === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {step.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-4">
          <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
            📚 {t.startLearning || 'Start Learning'}
          </button>
          <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
            💾 {t.savePath || 'Save Path'}
          </button>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
            🔄 {t.newSearch || 'New Search'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPathDisplay;
