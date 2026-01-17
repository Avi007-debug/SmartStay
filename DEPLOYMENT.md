# 🚀 SmartStay Deployment Guide

Complete guide for deploying SmartStay to production using Vercel (Frontend) and Render (Backend).

## 📋 Prerequisites

- GitHub account
- [Vercel](https://vercel.com/) account (free tier available)
- [Render](https://render.com/) account (free tier available)
- [Supabase](https://supabase.com/) project set up
- [Groq API](https://console.groq.com/) key

---

## 🔧 Pre-Deployment Checklist

- [ ] All code pushed to GitHub repository
- [ ] Supabase database schema deployed
- [ ] Environment variables documented
- [ ] `.env` files not committed to git
- [ ] Testing completed locally

---

## 🌐 Part 1: Deploy Backend to Render

### Step 1: Prepare Backend

Ensure your backend has these files:
- ✅ `render.yaml` (already created)
- ✅ `requirements.txt` with `gunicorn` (already updated)
- ✅ CORS configuration updated for production

### Step 2: Create Web Service on Render

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com/)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub account if not already connected
   - Select your SmartStay repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: smartstay-backend
   Region: Oregon (or closest to your users)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   Instance Type: Free
   ```

4. **Add Environment Variables**
   
   Click "Advanced" → "Add Environment Variable" and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `GROQ_API_KEY` | Your Groq API key | From console.groq.com |
   | `SUPABASE_URL` | Your Supabase URL | From Supabase dashboard |
   | `SUPABASE_SERVICE_KEY` | Your service role key | From Supabase dashboard |
   | `FRONTEND_URL` | (leave empty for now) | Add after frontend deployment |
   | `FLASK_ENV` | `production` | Required |
   | `PYTHON_VERSION` | `3.11.0` | Optional |

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Copy your backend URL: `https://smartstay-backend-xxxx.onrender.com`

### Step 3: Verify Backend Deployment

Test your backend:
```bash
curl https://your-backend-url.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "ai_configured": true
}
```

⚠️ **Note**: Free tier services on Render sleep after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

Ensure your frontend has:
- ✅ `vercel.json` (already created)
- ✅ Build script in `package.json`
- ✅ Environment variables documented

### Step 2: Create Project on Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Connect GitHub if not already connected
   - Select your SmartStay repository
   - Click "Import"

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL | Same as backend |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | From Supabase dashboard |
   | `VITE_BACKEND_URL` | Your Render backend URL | From Step 1 |

   Example:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_BACKEND_URL=https://smartstay-backend-xxxx.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (2-5 minutes)
   - Copy your frontend URL: `https://your-app-name.vercel.app`

### Step 3: Update Backend with Frontend URL

1. Go back to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` with your Vercel URL
5. Click "Save Changes"
6. Service will automatically redeploy

---

## ✅ Part 3: Post-Deployment Configuration

### Update README

Update the Live Demo section in README.md:
```markdown
## 🌐 Live Demo

- **Frontend**: https://your-app-name.vercel.app
- **Backend API**: https://smartstay-backend-xxxx.onrender.com
```

### Test Deployment

1. **Test Frontend**
   - Visit your Vercel URL
   - Check if UI loads correctly
   - Verify Supabase connection

2. **Test Backend**
   - Check backend health endpoint
   - Test AI features
   - Verify database operations

3. **Test Integration**
   - Create a test account
   - Search for PGs
   - Test chat functionality
   - Try AI features (sentiment analysis, recommendations)

### Monitor Services

**Vercel:**
- Analytics: [vercel.com/dashboard/analytics](https://vercel.com/dashboard/analytics)
- Logs: Click on deployment → "Logs" tab

**Render:**
- Logs: Service dashboard → "Logs" tab
- Metrics: Service dashboard → "Metrics" tab

---

## 🔒 Security Checklist

- [ ] All API keys stored as environment variables
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured with production URLs
- [ ] Supabase RLS policies enabled
- [ ] Service role key only used on backend
- [ ] Rate limiting considered for API endpoints

---

## 🐛 Troubleshooting

### Frontend Issues

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Ensure environment variables are set

**Blank page after deployment:**
- Check browser console for errors
- Verify environment variables are correct
- Check if backend URL is accessible

**404 on page refresh:**
- Already handled by `vercel.json` rewrites

### Backend Issues

**Service fails to start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check Python version compatibility

**AI features not working:**
- Verify `GROQ_API_KEY` is set correctly
- Check API quota on Groq console
- Review backend logs for errors

**CORS errors:**
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in app.py
- Ensure URLs don't have trailing slashes

**Database connection fails:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check Supabase project status
- Review database connection limits

### Performance Issues

**Slow initial load:**
- Render free tier has cold starts
- Consider upgrading to paid tier
- Implement loading states in frontend

**API timeouts:**
- Check Render service logs
- Verify database query performance
- Consider adding request caching

---

## 📊 Free Tier Limitations

### Vercel Free Tier
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth per month
- ✅ Automatic SSL
- ⚠️ Serverless function 10-second timeout

### Render Free Tier
- ✅ 750 hours/month free
- ✅ Automatic SSL
- ⚠️ Service sleeps after 15 min inactivity
- ⚠️ 512MB RAM limit
- ⚠️ Slower cold starts

### Upgrade Recommendations

Consider upgrading if:
- Service has consistent traffic (Render)
- Need faster response times
- Require more resources
- Want custom domains

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

1. **Auto-deploy on push:**
   - Enabled by default on main branch
   - Push to GitHub → Automatic deployment

2. **Preview deployments (Vercel):**
   - Every PR gets a preview URL
   - Test changes before merging

3. **Manual deployments:**
   - Trigger from dashboard if needed
   - Useful for environment changes

---

## 📝 Environment Variables Reference

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Backend (.env)
```env
GROQ_API_KEY=gsk_xxx...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
FRONTEND_URL=https://your-app.vercel.app
FLASK_ENV=production
```

---

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain (Optional)**
   - Add custom domain in Vercel settings
   - Configure DNS records
   - SSL automatically provisioned

2. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Review analytics regularly

3. **Optimization**
   - Enable caching where appropriate
   - Optimize images and assets
   - Consider CDN for static files

4. **Backup Strategy**
   - Regular Supabase backups
   - Export important data periodically
   - Version control for code

---

## 📞 Support

If you encounter issues:
1. Check logs in Vercel/Render dashboard
2. Review this troubleshooting guide
3. Check Supabase status page
4. Contact: avimore088@gmail.com

---

## ✅ Deployment Complete!

Your SmartStay application is now live! 🎉

- Frontend: Hosted on Vercel
- Backend: Hosted on Render
- Database: Supabase
- AI: Powered by Groq

**Remember to:**
- Keep environment variables secure
- Monitor usage and costs
- Update dependencies regularly
- Review logs for errors
