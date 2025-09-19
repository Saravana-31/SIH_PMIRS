import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';

// Move translations out of the component to avoid new references each render
const CHAT_TRANSLATIONS = {
    en: {
      chatTitle: "Chat about this internship",
      welcomeMessage: "Hi! I'm here to help you learn more about the",
      positionAt: "position at",
      whatWouldYouLike: "What would you like to know?",
      typeMessage: "Type your message...",
      send: "Send",
      errorMessage: "Sorry, I encountered an error. Please try again later.",
      quickQuestions: "Quick questions:",
      whatSkills: "What skills do I need?",
      whatWillLearn: "What will I learn?",
      goodFit: "Is this a good fit for me?",
      workCulture: "What's the work culture like?"
    },
    hi: {
      chatTitle: "इस इंटर्नशिप के बारे में चैट करें",
      welcomeMessage: "नमस्ते! मैं आपको",
      positionAt: "पद के बारे में अधिक जानने में मदद करने के लिए यहाँ हूँ",
      whatWouldYouLike: "आप क्या जानना चाहते हैं?",
      typeMessage: "अपना संदेश टाइप करें...",
      send: "भेजें",
      errorMessage: "क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया बाद में पुनः प्रयास करें।",
      quickQuestions: "त्वरित प्रश्न:",
      whatSkills: "मुझे कौन से कौशल चाहिए?",
      whatWillLearn: "मैं क्या सीखूंगा?",
      goodFit: "क्या यह मेरे लिए उपयुक्त है?",
      workCulture: "कार्य संस्कृति कैसी है?"
    },
    ta: {
      chatTitle: "இந்த இன்டர்ன்ஷிப் பற்றி அரட்டை அடிக்கவும்",
      welcomeMessage: "வணக்கம்! நான் உங்களுக்கு",
      positionAt: "பதவி பற்றி மேலும் அறிய உதவ இங்கே இருக்கிறேன்",
      whatWouldYouLike: "நீங்கள் என்ன அறிய விரும்புகிறீர்கள்?",
      typeMessage: "உங்கள் செய்தியை தட்டச்சு செய்யவும்...",
      send: "அனுப்பு",
      errorMessage: "மன்னிக்கவும், எனக்கு ஒரு பிழை ஏற்பட்டது। தயவுசெய்து பிறகு முயற்சிக்கவும்।",
      quickQuestions: "விரைவு கேள்விகள்:",
      whatSkills: "எனக்கு என்ன திறன்கள் தேவை?",
      whatWillLearn: "நான் என்ன கற்றுக்கொள்வேன்?",
      goodFit: "இது எனக்கு பொருத்தமானதா?",
      workCulture: "வேலை கலாச்சாரம் எப்படி இருக்கும்?"
    },
    te: {
      chatTitle: "ఈ ఇంటర్న్‌షిప్ గురించి చాట్ చేయండి",
      welcomeMessage: "హాయ్! నేను మీకు",
      positionAt: "స్థానం గురించి మరింత తెలుసుకోవడంలో సహాయపడటానికి ఇక్కడ ఉన్నాను",
      whatWouldYouLike: "మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
      typeMessage: "మీ సందేశాన్ని టైప్ చేయండి...",
      send: "పంపండి",
      errorMessage: "క్షమించండి, నాకు లోపం ఏర్పడింది। దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి।",
      quickQuestions: "త్వరిత ప్రశ్నలు:",
      whatSkills: "నాకు ఏ నైపుణ్యాలు కావాలి?",
      whatWillLearn: "నేను ఏమి నేర్చుకుంటాను?",
      goodFit: "ఇది నాకు అనుకూలమైనదా?",
      workCulture: "పని సంస్కృతి ఎలా ఉంటుంది?"
    }
};

const ChatBox = ({ internship, isOpen, onClose, language = 'en' }) => {
  const t = CHAT_TRANSLATIONS[language] || CHAT_TRANSLATIONS.en;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const lastWelcomeForIdRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message when the modal opens for a specific internship
  useEffect(() => {
    if (!isOpen || !internship) return;
    const currentId = internship.id;
    // Only push welcome once per internship open
    if (lastWelcomeForIdRef.current !== currentId) {
      setMessages([
        {
          id: Date.now(),
          type: 'assistant',
          content: `${t.welcomeMessage} ${internship.title} ${t.positionAt} ${internship.company}. ${t.whatWouldYouLike}`,
          timestamp: new Date()
        }
      ]);
      lastWelcomeForIdRef.current = currentId;
    }
  }, [isOpen, language, internship?.id]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:4000/chat_with_card', {
        internshipId: internship.id,
        question: userMessage.content,
        language: language
      });

      // Normalize different possible response shapes
      let content = '';
      const data = response?.data;
      if (typeof data === 'string') {
        content = data;
      } else if (data) {
        content =
          data.answer ||
          data.message ||
          data.reply ||
          data.text ||
          (Array.isArray(data.choices) && (data.choices[0]?.message?.content || data.choices[0]?.text)) ||
          data.output?.text ||
          '';
      }

      if (!content || !String(content).trim()) {
        content = t.errorMessage;
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: String(content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: t.errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !internship) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.chatTitle}</h3>
              <p className="text-sm text-gray-600">{internship.title} at {internship.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.typeMessage}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Quick questions */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">{t.quickQuestions}</p>
            <div className="flex flex-wrap gap-2">
              {[
                t.whatSkills,
                t.whatWillLearn,
                t.goodFit,
                t.workCulture
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
