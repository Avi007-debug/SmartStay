# 🏠 SmartStay - AI-Powered PG Accommodation Platform

> **Your Smart Solution for Finding and Managing Paying Guest Accommodations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Flask](https://img.shields.io/badge/Flask-Python-black.svg)](https://flask.palletsprojects.com/)

SmartStay is a comprehensive, production-ready platform that revolutionizes the PG (Paying Guest) accommodation search and management experience with AI-powered features, real-time communication, and intelligent recommendations.

## 🌐 Live Demo

- **Frontend**: `https://smartstay-ruddy.vercel.app/` 
- **Backend API**: `https://smartstay-izus.onrender.com` 

---

## ✨ Key Highlights

- 🤖 **6 AI-Powered Features** - Personalized recommendations, sentiment analysis, hidden charges detector, travel time estimator, description generator, and 24/7 chatbot support
- 💬 **Anonymous Chat System** - Secure, real-time messaging between users and property owners
- 🔔 **Smart Alerts** - Price drop notifications and vacancy alerts
- 👥 **Multi-Role Support** - Separate dashboards for Users, Owners, and Admins
- 📱 **Fully Responsive** - Seamless experience on desktop, tablet, and mobile
- 🔒 **Enterprise Security** - Row-level security, authentication, and data protection
- ⚡ **Real-time Updates** - Live notifications and instant messaging

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **Supabase Account** ([Sign up](https://supabase.com/) - Free tier available)
- **Groq API Key** ([Get free key](https://console.groq.com/))

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/smartstay.git
cd smartstay
```

2. **Setup Frontend**
```bash
cd frontend
npm install
```

3. **Setup Backend**
```bash
cd ../backend
pip install -r requirements.txt
```

4. **Configure Environment Variables**

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

5. **Setup Database**
- Go to Supabase Dashboard → SQL Editor
- Copy content from `backend/supabase_schema.sql`
- Execute the SQL to create all tables, policies, and functions

6. **Run the Application**

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Access at http://localhost:8080
```

**Terminal 2 - Backend:**
```bash
cd backend
python app.py
# API runs at http://localhost:5000
```

---

## 📸 Screenshots

### User Dashboard
![User Dashboard](frontend/public/image.png)
*Manage saved PGs, chats, and preferences*

### PG Search & Filters
*Advanced search with multiple filters and AI recommendations*

### Anonymous Chat
*Secure messaging between users and owners*

### Admin Panel
*Comprehensive user and listing management*

---

## 🎯 Core Features

### For Students/Users
- 🔍 **Advanced Search** - Filter by location, price, amenities, gender preference
- 💾 **Save Favorites** - Bookmark properties for later
- 💬 **Anonymous Chat** - Contact owners without revealing identity
- 📅 **Book Visits** - Schedule property viewings
- ⭐ **Reviews & Ratings** - Read and write property reviews
- ❓ **Q&A System** - Ask questions publicly on listings
- 🔔 **Smart Alerts** - Get notified of price drops and vacancies
- 🤖 **AI Assistant** - 24/7 chatbot for instant help

### For Property Owners
- 📝 **Easy Listing** - Post properties with AI-generated descriptions
- 📊 **Analytics** - Track views, saves, and engagement
- 💬 **Inquiry Management** - Respond to user messages
- ❓ **Q&A Management** - Answer questions about properties
- 🔄 **Toggle Availability** - Mark properties as active/inactive
- 📸 **Multi-Image Upload** - Showcase properties with multiple photos
- 📱 **WhatsApp Integration** - Add community group links

### For Administrators
- 👥 **User Management** - View and manage all users
- ✅ **Verification System** - Approve user and owner accounts
- 📋 **Listing Oversight** - Monitor all property listings
- 📄 **Document Review** - Verify submitted documents

---

## 🤖 AI Features

| Feature | Description | Technology |
|---------|-------------|------------|
| **Personalized Recommendations** | ML-based PG suggestions based on user preferences | Groq AI (llama-3.1-8b-instant) |
| **Sentiment Analysis** | Analyze review emotions and provide insights | Natural Language Processing |
| **Hidden Charges Detector** | Identify undisclosed fees in listings | AI Pattern Recognition |
| **Travel Time Estimator** | Calculate commute time to college/work | Distance & Route API |
| **Description Generator** | Auto-create compelling property descriptions | AI Text Generation |
| **Support Chatbot** | 24/7 AI-powered customer assistance | Conversational AI |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide Icons** - Modern icon library

### Backend
- **Flask** - Python web framework
- **Groq AI** - Fast AI inference
- **CORS** - Cross-origin resource sharing

### Database & Services
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - File storage
  - Row Level Security

---

## 📁 Project Structure

```
SmartStay/
├── frontend/                   # React + TypeScript application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ai/           # AI feature components
│   │   │   ├── chat/         # Chat interface
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── pages/            # Route pages
│   │   ├── lib/              # Utilities & services
│   │   │   └── supabase.ts   # Database operations
│   │   └── hooks/            # Custom React hooks
│   ├── .env                  # Environment variables
│   └── package.json
│
├── backend/                   # Flask API server
│   ├── app.py                # Main application
│   ├── ai_provider.py        # AI integration
│   ├── supabase_schema.sql   # Database schema
│   ├── .env                  # API keys
│   └── requirements.txt      # Python dependencies
│
├── FEATURES.md               # Complete features table
└── README.md                 # This file
```

---

## 🔐 Security

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Authentication** - Secure user login with Supabase Auth
- ✅ **Email Verification** - Account validation
- ✅ **Anonymous Profiles** - Privacy in chat communications
- ✅ **Secure Storage** - Protected file uploads with RLS
- ✅ **Input Validation** - Frontend and backend sanitization

---

## 📊 Database Schema

**Core Tables:**
- `profiles` - User information
- `pg_listings` - Property listings
- `reviews` - Ratings and reviews
- `chats` & `messages` - Communication system
- `saved_pgs` - Bookmarked properties
- `qna` - Questions and answers
- `notifications` - User alerts
- `price_drop_alerts` - Price monitoring
- `verification_documents` - Admin queue

**Views:**
- `user_profiles` - Joined profiles + auth data

**Features:**
- Real-time triggers for notifications
- Automated price drop alerts
- Comprehensive RLS policies

---

## 🧪 Testing

### API Testing
```bash
cd backend
# Run all API tests
./test_all.ps1
```

### Manual Testing
1. Create test accounts (User, Owner, Admin)
2. Test all user flows
3. Verify AI features
4. Check real-time updates
5. Test mobile responsiveness

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd backend
# Deploy Flask app with requirements.txt
```

### Database
- Supabase hosted PostgreSQL (no deployment needed)
- Execute `supabase_schema.sql` in production project

---

## 📖 Documentation

- **[FEATURES.md](FEATURES.md)** - Complete features list with implementation details
- **[backend/TEST_API.md](backend/TEST_API.md)** - API endpoint documentation
- **[backend/supabase_schema.sql](backend/supabase_schema.sql)** - Database schema with comments

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## � Deployment

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/) and sign in
3. Click "New Project" and import your repository
4. Configure the build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_BACKEND_URL`: Your Render backend URL (add after deploying backend)
6. Click "Deploy"
7. Copy your deployment URL and update it in the README

### Deploy Backend to Render

1. Push your code to GitHub
2. Go to [Render](https://render.com/) and sign in
3. Click "New +" → "Web Service"
4. Connect your repository and configure:
   - **Name**: `smartstay-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Add environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `FRONTEND_URL`: Your Vercel deployment URL
   - `FLASK_ENV`: `production`
6. Click "Create Web Service"
7. Copy your backend URL and add it to Vercel environment variables as `VITE_BACKEND_URL`
8. Redeploy frontend on Vercel to apply the new environment variable

### Important Notes

- Free tier on Render may have cold starts (services sleep after 15 min of inactivity)
- Update CORS settings in [backend/app.py](backend/app.py) with your production URLs
- Keep your API keys secure and never commit them to version control
- After deployment, test all AI features to ensure API keys are working correctly

---

## �📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**SmartStay Team**

---

## 📞 Contact & Support

- **Email**: avimore088@gmail.com
- **Phone**: +91 93225 64784

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Groq](https://groq.com/) - AI inference platform
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

## 📈 Stats

- **58 Features** implemented
- **6 AI Endpoints** powered by Groq
- **20 Database Tables** with RLS
- **3 User Roles** (User, Owner, Admin)
- **100% TypeScript** frontend
- **Real-time** messaging & notifications

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

Made with ❤️ by the SmartStay Team

</div>
