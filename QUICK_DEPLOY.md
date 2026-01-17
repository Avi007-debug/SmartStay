# 🚀 Quick Deployment Checklist

## Before You Deploy

- [ ] All changes pushed to GitHub (deployment branch)
- [ ] `.env` files NOT committed (check .gitignore)
- [ ] All components use `API_CONFIG.BACKEND_URL`
- [ ] Backend has `gunicorn` in requirements.txt
- [ ] Frontend has `vercel.json` configuration
- [ ] Backend has `render.yaml` configuration

## Step 1: Deploy Backend to Render

1. **Go to** [render.com/dashboard](https://dashboard.render.com/)
2. **Click** "New +" → "Web Service"
3. **Connect** your SmartStay GitHub repository
4. **Configure**:
   - Name: `smartstay-backend`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. **Add Environment Variables**:
   ```
   GROQ_API_KEY=your_groq_api_key
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key
   FRONTEND_URL=(leave empty for now)
   FLASK_ENV=production
   ```
6. **Deploy** and wait 5-10 minutes
7. **Copy** backend URL: `https://smartstay-backend-xxxx.onrender.com`

## Step 2: Deploy Frontend to Vercel

1. **Go to** [vercel.com/new](https://vercel.com/new)
2. **Import** your SmartStay GitHub repository
3. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_BACKEND_URL=https://smartstay-backend-xxxx.onrender.com
   ```
   ⚠️ **Important**: Use the backend URL from Step 1
5. **Deploy** and wait 2-5 minutes
6. **Copy** frontend URL: `https://your-app.vercel.app`

## Step 3: Update Backend with Frontend URL

1. **Go back** to Render dashboard
2. **Select** your backend service
3. **Click** "Environment" tab
4. **Update** `FRONTEND_URL` to your Vercel URL
5. **Save** - service will auto-redeploy

## Step 4: Update README

Update [README.md](README.md) with your actual URLs:

```markdown
## 🌐 Live Demo

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://smartstay-backend-xxxx.onrender.com
```

## Step 5: Test Deployment

### Test Frontend ✅
- [ ] Visit your Vercel URL
- [ ] UI loads correctly
- [ ] Can create account / login
- [ ] Search works

### Test Backend ✅
- [ ] Visit `https://your-backend.onrender.com/api/health`
- [ ] Should return: `{"status": "healthy", "ai_configured": true}`

### Test Integration ✅
- [ ] AI Features work (chatbot, recommendations)
- [ ] Can post PG listings
- [ ] Chat system works
- [ ] Notifications work

## Troubleshooting

### ❌ Frontend shows "Network Error"
- Check if backend URL is correct in Vercel environment variables
- Verify backend is deployed and running on Render
- Check browser console for actual error
- Solution: Redeploy frontend after updating `VITE_BACKEND_URL`

### ❌ Backend fails to start
- Check Render logs for Python errors
- Verify all environment variables are set
- Check `requirements.txt` has all dependencies
- Solution: Fix errors and push to GitHub (auto-redeploys)

### ❌ CORS errors
- Verify `FRONTEND_URL` is set in Render
- Check it matches your Vercel URL exactly
- No trailing slashes
- Solution: Update environment variable and redeploy

### ❌ AI features not working
- Verify `GROQ_API_KEY` is set correctly
- Check Groq API quota
- Review backend logs on Render
- Solution: Check API key validity

### ⚠️ Slow first load (Render)
- **Normal**: Free tier sleeps after 15 min inactivity
- **First request**: Takes 30-60 seconds (cold start)
- **Solution**: Upgrade to paid tier or accept delay

## Environment Variables Reference

### Frontend (.env - for local development only)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=http://localhost:5000
```

### Backend (.env - for local development only)
```env
GROQ_API_KEY=gsk_xxx...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
FRONTEND_URL=http://localhost:5173
FLASK_ENV=development
```

### Vercel (Production)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=https://smartstay-backend-xxxx.onrender.com
```

### Render (Production)
```env
GROQ_API_KEY=gsk_xxx...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
FRONTEND_URL=https://your-app.vercel.app
FLASK_ENV=production
```

## 🎉 Deployment Complete!

Once both services are deployed and configured:

1. ✅ Frontend live on Vercel
2. ✅ Backend live on Render
3. ✅ Database on Supabase
4. ✅ AI powered by Groq
5. ✅ All features working

## Support

- 📧 Email: avimore088@gmail.com
- 📱 Phone: +91 93225 64784
- 📖 Full Guide: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Estimated Time**: 20-30 minutes total
**Cost**: $0 (using free tiers)
