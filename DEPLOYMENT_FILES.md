# 📦 SmartStay Deployment Files

This directory contains configuration files for deploying SmartStay to production.

## Files Created

### Frontend (Vercel)
- **`frontend/vercel.json`** - Vercel deployment configuration
  - Handles SPA routing with rewrites
  - Configures caching for static assets
  - Automatic SSL and CDN

- **`frontend/.env.example`** - Environment variables template
  - Copy to `.env` and fill in your values
  - Required for local development and deployment

### Backend (Render)
- **`backend/render.yaml`** - Render deployment configuration
  - Service configuration
  - Build and start commands
  - Environment variable definitions
  - Python version specification

- **`backend/requirements.txt`** - Updated with gunicorn
  - Added `gunicorn==21.2.0` for production server
  - All other dependencies remain the same

### Documentation
- **`DEPLOYMENT.md`** - Complete deployment guide
  - Step-by-step instructions for Vercel
  - Step-by-step instructions for Render
  - Troubleshooting tips
  - Security checklist
  - Free tier limitations

- **`README.md`** - Updated with:
  - Live demo section with placeholder URLs
  - Deployment instructions
  - Links to detailed deployment guide

## Code Changes

### Backend (`backend/app.py`)
1. **CORS Configuration** - Updated to support production URLs
   ```python
   allowed_origins = [
       "http://localhost:8080",
       "http://localhost:5173",
       os.getenv("FRONTEND_URL", "")
   ]
   ```

2. **Production Settings** - Updated app.run for production
   ```python
   port = int(os.getenv('PORT', 5000))
   debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
   app.run(debug=debug_mode, host='0.0.0.0', port=port)
   ```

## Environment Variables

### Frontend (Add in Vercel)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=your_render_backend_url
```

### Backend (Add in Render)
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=your_vercel_frontend_url
FLASK_ENV=production
```

## Quick Deploy

### 1. Deploy Backend (Render)
```bash
1. Go to render.com
2. New Web Service
3. Connect GitHub repo
4. Root directory: backend
5. Add environment variables
6. Deploy
```

### 2. Deploy Frontend (Vercel)
```bash
1. Go to vercel.com
2. New Project
3. Connect GitHub repo
4. Root directory: frontend
5. Add environment variables (including backend URL from step 1)
6. Deploy
```

### 3. Update URLs
```bash
1. Update FRONTEND_URL in Render
2. Update README.md with actual URLs
3. Test the deployment
```

## Next Steps

1. ✅ All configuration files created
2. ✅ Code updated for production
3. ✅ Documentation complete
4. 📤 Push to GitHub
5. 🚀 Deploy to Vercel and Render
6. 📝 Update README with actual URLs
7. ✅ Test all features

## Support

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

For issues, contact: avimore088@gmail.com
