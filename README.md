# SmartStay - Complete Setup & Documentation

> **Version**: Production Ready  
> **Last Updated**: January 8, 2026  
> **Stack**: React + TypeScript + Supabase + Flask (Gemini AI)

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed  
- Supabase account (free tier)
- Google Gemini API key (free)

### 2. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd SmartStay

# Frontend setup
cd frontend
npm install

# Backend setup
cd ../backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
# OPENROUTE_API_KEY=your_openroute_key (optional - for travel time)
```

### 4. Setup Supabase Database

1. Go to your Supabase Dashboard → SQL Editor
2. Copy entire content from `backend/supabase_schema.sql`
3. Paste and run (creates all tables, RLS policies, functions)

### 5. Run Application

**Terminal 1 - Frontend**:
```bash
cd frontend
npm run dev
# Opens at http://localhost:8080
```

**Terminal 2 - Backend**:
```bash
cd backend
python app.py
# Runs at http://localhost:5000
```

---

## 📁 Project Structure

```
SmartStay/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── lib/               # Utilities & services
│   │   │   └── supabase.ts    # All database operations
│   │   └── App.tsx            # Main app & routing
│   ├── .env                   # Supabase credentials
│   └── package.json
│
├── backend/                    # Flask + Gemini AI
│   ├── app.py                 # Main API server
│   ├── supabase_schema.sql    # Complete database schema
│   ├── TEST_API.md            # API documentation
│   ├── test_all.ps1           # API test script
│   ├── .env                   # API keys
│   └── requirements.txt
│
└── CREATE_QNA_TABLE.sql       # Q&A feature (optional)
```

---

## 🎯 Key Features

### For Users/Students
- 🔍 Search PGs with advanced filters
- ⭐ Reviews with upvote/downvote
- 💬 Anonymous chat with owners
- 💰 Hidden charge detection (AI)
- 🧠 Sentiment analysis on reviews (AI)
- 📍 Save favorite PGs
- 🔔 Vacancy alerts
- ❓ Q&A with property owners

### For Property Owners
- 📝 List PG/hostels
- ✅ Verification system (documents)
- 💬 Respond to inquiries
- 📊 View analytics
- ❓ Answer user questions

### For Admins
- 👥 User management
- 🏢 Listing management
- ✅ Verification approval/rejection
- 📊 Dashboard with stats
- 🚩 Report moderation

---

## 🗄️ Database Schema

### Core Tables
1. **profiles** - User/Owner/Admin accounts with roles
2. **pg_listings** - Property listings with all details
3. **reviews** - User reviews with voting system
4. **saved_pgs** - Bookmark functionality
5. **chats** - Anonymous messaging
6. **messages** - Chat messages
7. **notifications** - Real-time alerts
8. **qna** - Q&A between users and owners
9. **verification_documents** - Owner verification
10. **vacancy_alerts** - User alert subscriptions

### Key Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Real-time subscriptions (chat, notifications)
- ✅ Automatic timestamps
- ✅ Foreign key constraints
- ✅ Indexes for performance

---

## 🔧 Backend API Endpoints

### Health Check
**GET** `/health`
```bash
curl http://localhost:5000/health
```

### AI Sentiment Analysis
**POST** `/api/ai/sentiment-analysis`
```json
{
  "reviews": [{"text": "Great place!"}],
  "pg_name": "Sunshine PG"
}
```

### Hidden Charge Detection
**POST** `/api/ai/hidden-charges`
```json
{
  "description": "Spacious room...",
  "rent": 8500,
  "amenities": ["WiFi", "Water"]
}
```

### AI Description Generator
**POST** `/api/ai/generate-description`
```json
{
  "amenities": ["WiFi", "AC"],
  "location": "Koramangala",
  "rent": 12000
}
```

### Travel Time (Demo Mode)
**POST** `/api/ai/travel-time`
```json
{
  "from": {"lat": 28.6139, "lng": 77.2090},
  "to": "College"
}
```

> **Note**: Travel time uses OpenRouteService API (not connected yet). Add `OPENROUTE_API_KEY` to enable.

---

## 🧪 Testing

### Test Backend APIs
```bash
cd backend
./test_all.ps1    # Automated test script
```

Or see `backend/TEST_API.md` for manual testing examples.

### Test Frontend
1. Start frontend: `npm run dev`
2. Open http://localhost:8080
3. Test flows:
   - Sign up as user/owner
   - Post a PG listing (owner)
   - Search and save PGs (user)
   - Leave reviews
   - Use anonymous chat
   - Admin dashboard (create admin user in Supabase)

---

## 🔐 User Roles & Access

### User (Default)
- Search and view PGs
- Save favorites
- Write reviews
- Chat with owners
- Set vacancy alerts
- Ask questions

### Owner
- All user features +
- Post PG listings
- Submit verification documents
- Answer user questions
- View listing analytics

### Admin
- Access admin dashboard
- Approve/reject verifications
- Manage users and listings
- View system stats
- Moderate content

> **Create Admin**: In Supabase → Table Editor → profiles → Edit user → Set `role = 'admin'`

---

## 🔑 Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```env
# Required - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# Optional - Get from https://openrouteservice.org/dev/#/signup
OPENROUTE_API_KEY=your_openroute_key
```

---

## 🐛 Common Issues & Fixes

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend API errors
- Check `GEMINI_API_KEY` is set in `.env`
- Verify backend is running on port 5000
- Check CORS settings in `app.py`

### Database connection issues
- Verify Supabase credentials in frontend `.env`
- Check RLS policies are enabled
- Ensure schema is fully executed

### Admin dashboard not accessible
- Create admin user: Update `profiles` table → set `role = 'admin'`
- Sign out and sign in again

---

## 📊 Database Management

### View Data
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select any table to view/edit

### Reset Database
```sql
-- Drop all tables (run in SQL Editor)
DROP TABLE IF EXISTS profiles, pg_listings, reviews, saved_pgs, 
  chats, messages, notifications, qna, verification_documents, 
  vacancy_alerts, user_preferences, reports CASCADE;

-- Then re-run backend/supabase_schema.sql
```

### Backup Database
1. Supabase Dashboard → Database → Backups
2. Enable automatic backups (daily)

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
1. Connect GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables

### Backend (Render/Railway)
1. Connect repository
2. Build command: `pip install -r requirements.txt`
3. Start command: `python app.py`
4. Add environment variables

---

## 📝 Recent Updates

### Latest Features
✅ Admin dashboard with verification workflow  
✅ Q&A system between users and owners  
✅ Real-time notifications  
✅ Anonymous chat system  
✅ AI-powered sentiment analysis  
✅ Hidden charge detection  
✅ Comprehensive API testing suite  

### Bug Fixes
✅ Fixed rent display (monthly_rent → rent)  
✅ Fixed amenities display (all categories)  
✅ Fixed image loading with fallback  
✅ Fixed review name display (anonymous support)  
✅ Connected admin dashboard to real data  

---

## 📚 Additional Resources

- **API Testing**: See `backend/TEST_API.md`
- **Database Schema**: See `backend/supabase_schema.sql`
- **Q&A Feature**: See `CREATE_QNA_TABLE.sql`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Support

For issues or questions:
1. Check this documentation
2. Review `backend/TEST_API.md` for API help
3. Check Supabase logs for database issues
4. Review browser console for frontend errors

---

**Built with ❤️ using React, TypeScript, Supabase, and Google Gemini AI**
