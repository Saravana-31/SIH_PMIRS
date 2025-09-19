# AI-Based Internship Recommendation Engine for PM Internship Scheme

## 🎯 Problem Statement 25034 Solution

A comprehensive internship recommendation system that uses AI to match students with relevant internship opportunities while ensuring fairness and accessibility across different regions and skill levels.

## ✨ Key Features

### 🧠 Smart Recommendation Engine
- **Skill-First Approach**: Prioritizes skill matching to avoid skill mismatch issues
- **Fairness-Aware**: Ensures rural and non-Tier-1 city candidates get valid results
- **Narrative Diversity**: Provides human-like explanations for recommendations
- **Learning Path Generator**: Suggests skill development paths when no direct matches found

### 🌍 Multi-Language Support
- **12 Indian Languages**: Tamil, Hindi, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Malayalam, Odia, Urdu, English
- **Regional TTS**: Text-to-speech in selected regional language with voice customization
- **Dynamic Translation**: All UI elements translate based on language selection

### 🎨 Modern UI/UX
- **TailwindCSS**: Clean, responsive design with modern components
- **Card-Based Layout**: SIH-style internship cards with clear information hierarchy
- **Interactive Filters**: Filter by stipend range, location, and skills
- **Accessibility**: Screen reader friendly with proper ARIA labels

### 🔊 Advanced Text-to-Speech
- **Multi-Language TTS**: Supports regional Indian languages
- **Voice Controls**: Adjustable rate, pitch, and volume
- **Smart Voice Selection**: Automatically selects best available voice for language
- **Play/Pause/Resume**: Full control over speech playback

## 🏗️ Architecture

### Frontend (React)
- **React 19** with modern hooks
- **TailwindCSS** for styling
- **Multi-tag Input** component with autocomplete
- **Responsive Design** for all screen sizes

### Backend (Dual Stack)
- **Node.js + Express** (Primary): Enhanced recommendation engine with JSON data support
- **Python + Flask** (Fallback): Basic recommendation system
- **MongoDB**: Database with comprehensive sample data (optional)
- **JSON Data Mode**: Lightweight mode using local JSON files
- **Groq AI Chat**: AI-powered chatbot for each internship

### Database
- **26+ Sample Internships** across various sectors and locations
- **Comprehensive Coverage**: Technology, Business, Finance, Design, Healthcare, Engineering
- **Fairness Implementation**: Includes rural and Tier-2/3 city opportunities
- **Flexible Data Sources**: MongoDB or JSON file support
- **Modular Data Loader**: Easy to replace with PM Internship Scheme portal data

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+) [Optional - for fallback backend]
- MongoDB (v4.4+) [Optional - can use JSON mode instead]
- Groq API Key [For AI chat functionality]

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PM_Intern
   ```

2. **Setup Node.js Backend (JSON Mode - Recommended)**
   ```bash
   cd node_backend
   npm install
   
   # Configure environment variables
   # Edit .env file and set:
   # USE_JSON_DATA=true
   # GROQ_API_KEY=your_groq_api_key_here
   
   npm run dev
   ```

3. **Setup MongoDB (Optional - for MongoDB mode)**
   ```bash
   # Start MongoDB service
   mongod
   
   # Insert sample data
   cd backend
   python sample_data.py
   
   # To use MongoDB mode, set USE_JSON_DATA=false in node_backend/.env
   ```

4. **Setup Python Backend (Optional - Fallback)**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

5. **Setup React Frontend**
   ```bash
   cd intern_frontend
   npm install
   npm start
   ```

### Access the Application
- Frontend: http://localhost:3000
- Node Backend: http://localhost:4000
- Python Backend: http://localhost:5000

## 🔧 Configuration

### JSON Data Mode (Recommended)
The application now supports a lightweight JSON data mode that doesn't require MongoDB:

1. **Enable JSON Mode**: Set `USE_JSON_DATA=true` in `node_backend/.env`
2. **Data Location**: Internship data is stored in `node_backend/data/internships.json`
3. **Benefits**: 
   - No MongoDB setup required
   - Faster startup
   - Easy to modify data
   - Perfect for development and testing

### Groq AI Chat Integration
Each internship card now includes an AI-powered chat feature:

1. **Get Groq API Key**: Sign up at [console.groq.com](https://console.groq.com)
2. **Configure API Key**: Set `GROQ_API_KEY=your_api_key` in `node_backend/.env`
3. **Features**:
   - Ask questions about specific internships
   - Get personalized advice
   - Learn about required skills
   - Understand work culture and expectations

### Environment Variables
Create `node_backend/.env` with the following variables:

```env
# Data Source Configuration
USE_JSON_DATA=true

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# MongoDB Configuration (used when USE_JSON_DATA=false)
MONGO_URI=mongodb://localhost:27017
DB_NAME=internship_recommendation

# Server Configuration
PORT=4000
```

## 📊 Sample Data

The system includes **26 comprehensive internship records** covering:

### Sectors
- Technology (Software, AI/ML, DevOps, Cybersecurity)
- Business (Marketing, HR, Operations, Consulting)
- Finance (Investment Banking, Accounting, Financial Analysis)
- Design (UI/UX, Graphic Design)
- Healthcare (Biotech, Pharmaceutical, Healthcare IT)
- Engineering (Mechanical, Civil, Electrical)
- Agriculture Tech
- E-commerce
- Education Technology

### Locations
- **Tier-1 Cities**: Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Pune, Kolkata
- **Tier-2/3 Cities**: Coimbatore, Indore, Jaipur, Bhubaneswar, Kochi
- **Rural Opportunities**: Agriculture tech, local business internships

### Skills Coverage
- **Programming**: Python, JavaScript, React, Node.js, SQL, etc.
- **Design**: Figma, Adobe XD, Photoshop, Illustrator
- **Business**: Excel, Digital Marketing, Analytics, Project Management
- **Engineering**: CAD, SolidWorks, AutoCAD, MATLAB
- **Healthcare**: Laboratory Techniques, Drug Development, Quality Control

## 🎯 Recommendation Algorithm

### Scoring System
1. **Skills Match** (Primary): +3 points per exact skill match
2. **Related Skills**: +2 points per related skill (capped)
3. **Education Match**: +2 points
4. **Department Match**: +2 points
5. **Sector Match**: +2 points
6. **Location Match**: +1 point (only if skills exist)
7. **Stipend Bonus**: +1 point for competitive stipends

### Categories
- **Best Fit**: 3+ skill matches or strong overall alignment
- **Growth Potential**: Missing 1-2 skills but good foundation
- **Alternative**: Education/department/sector match despite skill gap

### Fairness Features
- **No Skill Mismatch**: Won't recommend roles with zero skill overlap
- **Rural Inclusion**: Ensures non-Tier-1 opportunities are surfaced
- **Learning Paths**: Provides skill development suggestions

## 🔧 API Endpoints

### Node.js Backend (Primary)
- `POST /recommend` - Get internship recommendations
- `GET /autocomplete/:type` - Autocomplete suggestions
- `POST /chat_with_card` - AI chat with internship details

### Python Backend (Fallback)
- `POST /find_internships` - Basic recommendation
- `GET /autocomplete/:field` - Field-specific autocomplete

### Chat API Usage
```javascript
// Example chat request
POST /chat_with_card
{
  "internshipId": "1",
  "question": "What skills do I need for this internship?"
}

// Response
{
  "answer": "For this Software Development Intern position, you'll need..."
}
```

## 🌟 Unique Features for SIH

### 1. Concise Recommendation System (SIH25034 Enhanced)
Crisp, minimal recommendation text for better user experience:
- "Strong skill match: Python, JavaScript, React"
- "Location match: Bangalore"
- "High stipend: ₹25,000"
- "Growth potential: Learn Node.js, MongoDB"

### 2. Learning Path Generator
When no direct matches found, suggests targeted learning paths:
- Python Programming Fundamentals (4-6 weeks)
- JavaScript & Web Development (6-8 weeks)
- SQL & Database Management (3-4 weeks)
- Digital Marketing Fundamentals (4-5 weeks)

### 3. Fairness-Aware Filtering
- Ensures rural candidates see relevant opportunities
- Balances Tier-1 and Tier-2/3 city internships
- Provides growth opportunities for skill gaps

### 4. Complete Translation Support
- **UI Labels**: All interface elements in 12+ languages
- **Dynamic Content**: Recommendation text translates automatically
- **Chatbot Responses**: AI answers in selected language
- **Voice Support**: TTS works with translated content
- **Seamless Experience**: Language switching affects all content

### 5. AI-Powered Chat Assistant
- **Interactive Q&A**: Ask questions about any internship
- **Personalized Advice**: Get tailored recommendations and insights
- **Skill Guidance**: Learn what skills you need and how to develop them
- **Context-Aware**: AI understands the specific internship details
- **Quick Questions**: Pre-built question templates for common queries
- **Multilingual Support**: Chat responses in 12+ Indian languages
- **Concise Answers**: 2-3 sentence responses for quick understanding

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts
- **Desktop Enhanced**: Full feature set on larger screens
- **Touch-Friendly**: Large tap targets and gestures

## 🔒 Security & Performance

- **CORS Enabled**: Cross-origin requests handled
- **Input Validation**: Sanitized user inputs
- **Error Handling**: Graceful fallbacks
- **Performance**: Debounced autocomplete, efficient filtering

## 🧪 Testing

The system has been tested with:
- Various skill combinations
- Different education backgrounds
- Multiple language selections
- Filter combinations
- TTS functionality across languages

## 🔄 Modular Data Architecture

The system is designed with a modular data loader that makes it easy to integrate with different data sources:

### Current Data Sources
- **JSON Files**: `node_backend/data/internships.json` (26 sample internships)
- **MongoDB**: Traditional database with same data structure

### Easy Integration with PM Internship Scheme
To integrate with the PM Internship Scheme portal data:

1. **Replace Data Loader**: Modify `node_backend/dataLoader.js` to fetch from your API
2. **Maintain Interface**: Keep the same function signatures (`getAllInternships()`, `getById()`, `filter()`)
3. **No Endpoint Changes**: All existing endpoints will work without modification

### Example Integration
```javascript
// In dataLoader.js - replace JSON loading with API calls
export function getAllInternships() {
  return fetch('https://pm-internship-scheme.gov.in/api/internships')
    .then(response => response.json());
}
```

## 🚀 SIH25034 Enhancements

### Recent Improvements
- **Concise Recommendations**: Short, crisp bullet points instead of long explanations
- **Multilingual Chatbot**: AI responds in user's selected language (12+ languages)
- **Complete Translation**: Dynamic content now translates with UI labels
- **Enhanced Accessibility**: Voice features work with translated content
- **Future-Ready Architecture**: Placeholders for advanced features

### Planned Features (SIH25034 Roadmap)
- **Explainable Scoring**: Show detailed +points/-points per criterion
- **User Preference Weights**: Customize priorities (Skills > Stipend > Location)
- **Bias Mitigation**: Ensure diversity, prevent overfitting to city/sector
- **Comparison Mode**: Side-by-side internship comparison
- **Export Favorites**: Download personalized PDF reports
- **Advanced Analytics**: Track success rates and skill gaps

## 📈 Future Enhancements

- Machine Learning model integration
- User preference learning
- Advanced analytics dashboard
- Mobile app development
- Integration with job portals
- Real-time data synchronization with PM Internship Scheme

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is developed for SIH Problem Statement 25034.

## 👥 Team

Developed as a solution for the Smart India Hackathon 2024 - Problem Statement 25034: "AI-Based Internship Recommendation Engine for PM Internship Scheme"

---

**🎉 Ready to revolutionize internship matching with AI-powered recommendations!**
