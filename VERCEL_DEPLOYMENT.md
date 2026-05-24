# Vercel Deployment Guide

Deploy your Khanyisa frontend to Vercel (free tier available)

## 🚀 Quick Start

### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub (recommended)

### 2. Deploy Frontend

#### Option A: Deploy from GitHub (Recommended - Auto Deploy)

1. Push your frontend code to GitHub
   ```bash
   git add .
   git commit -m "Deploy frontend to Vercel"
   git push
   ```

2. Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the folder: `./` (root, since frontend is there)
   - Or configure custom build settings

3. Vercel auto-detects Vite project

4. Click "Deploy"

#### Option B: Deploy with CLI

1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Deploy
   ```bash
   cd c:\Users\khany\OneDrive\Conscious Trader 2.0
   vercel
   ```

3. Follow prompts:
   - Link to existing project? → No (first time)
   - Project name: `khanyisa`
   - Framework: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`

### 3. Configure Environment Variables

In Vercel dashboard:

**Go to: Project Settings → Environment Variables**

Add these variables for **Production**:
```
VITE_FINNHUB_API_KEY=d7n1c31r01qppri37k0gd7n1c31r01qppri37k10
VITE_ALPHA_VANTAGE_KEY=0FAEEPHTS2DGZZ56
VITE_NEWSAPI_KEY=9fd4b1b491d54c0fa3a2179f1e7e06d9
VITE_API_BASE_URL=https://your-railway-backend.railway.app
```

### 4. Verify Deployment

1. Vercel gives you a URL: `https://xxx.vercel.app`

2. Test the site:
   - Open https://xxx.vercel.app
   - Should load Khanyisa dashboard

3. Test backend connection:
   - Try to register/login
   - Should connect to your Railway backend

---

## 🌐 Custom Domain

1. Go to Project Settings → Domains
2. Add your domain (if you have one)
3. Configure DNS records
4. SSL certificate auto-generated

Example: `trading.khanyisa.co.za`

---

## 🔄 Continuous Deployment

**Auto Deploy on Git Push:**
1. Connected to GitHub ✅
2. Every time you push: Vercel auto-deploys
3. View deployment history in dashboard

**Preview Deployments:**
- For each Pull Request, Vercel creates preview URL
- Review before merging to main

**Production Deployment:**
- Merging to main branch = Production deploy
- Automatically gets PRODUCTION env vars

---

## 📊 Build & Deployment

### Build Configuration

**In Vercel Dashboard → Settings:**

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

These are usually auto-detected. If not:

1. Go to Settings → General
2. Scroll to "Build, Development & Output"
3. Set values above

### Build Logs

1. Dashboard → Deployments tab
2. Click on deployment
3. View build logs

---

## 🔗 Connect Backend

### Update Frontend Configuration

In `src/config.js` or create `src/config.production.js`:

```javascript
export const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://your-railway-backend.railway.app'
    : 'http://localhost:5000';
```

Or just use `.env` variables (already configured above).

### Test Connection

1. After deployment, test on Vercel URL
2. Try to register: Should POST to Railway backend
3. Should receive auth token
4. Check browser Network tab

---

## 🚨 Troubleshooting

### "CORS error from backend"
- Ensure Railway backend has correct FRONTEND_URL
- Vercel URL format: `https://xxx.vercel.app`
- Restart Railway backend after updating

### "API key not found"
- Verify environment variables in Vercel dashboard
- Check they match your `.env.local`
- Redeploy after adding env vars

### "Cannot connect to backend"
- Test backend health: `https://your-backend.railway.app/health`
- Verify VITE_API_BASE_URL is correct
- Check for typos in URL

### "Build fails"
- Check build logs in Vercel
- Common: Missing environment variables
- Solution: Add env vars, redeploy

### "Blank page or errors"
- Check browser console for errors
- Check Network tab for API failures
- Review build logs for TypeScript errors

---

## 📊 Vercel Pricing

**Free tier includes:**
- Unlimited projects & deployments
- Custom domains
- Analytics
- 100GB bandwidth/month

**Pro ($20/month):**
- Team collaboration
- Advanced analytics
- Priority support

**Enterprise:**
- Custom SLA
- Advanced features

---

## 🔄 Deployment Updates

### Update Frontend Code

Option A (Git Auto Deploy):
```bash
git push  # Vercel auto-deploys
```

Option B (Vercel CLI):
```bash
vercel --prod
```

### Rollback to Previous Version

1. Dashboard → Deployments
2. Click on previous deployment
3. Select "Promote to Production"

---

## 📈 Monitoring

### Analytics
- Dashboard → Analytics tab
- View traffic, performance, errors

### Speed Insights
- Vercel Web Analytics dashboard
- Core Web Vitals monitoring
- Performance recommendations

### Error Tracking
- Catch errors automatically
- Set up error reporting

---

## 🌍 Environment-Specific Configs

**Development:**
```
VITE_API_BASE_URL=http://localhost:5000
(Use local backend)
```

**Staging (optional):**
```
VITE_API_BASE_URL=https://staging-backend.railway.app
```

**Production:**
```
VITE_API_BASE_URL=https://your-production-backend.railway.app
```

---

## 📚 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Documentation: https://vercel.com/docs
- Vite on Vercel: https://vercel.com/guides/nextjs
- CLI Reference: https://vercel.com/cli

---

## 🎯 Next Steps

1. ✅ Backend deployed to Railway
2. ✅ Frontend deployed to Vercel
3. ➡️ Connect frontend to backend
4. ➡️ Test full workflow (register → trade → approve)
5. ➡️ Set up custom domain (optional)

---

## Your Production URLs

**Frontend:**
```
https://xxx.vercel.app
```

**Backend:**
```
https://xxx.railway.app
```

**Register:**
```
POST https://xxx.vercel.app/api/auth/register
```

**Dashboard:**
```
https://xxx.vercel.app/dashboard
```

Test it out! 🚀

---

## ✅ Deployment Checklist

- [ ] GitHub account with code pushed
- [ ] Vercel account created
- [ ] Project connected to GitHub
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Site loads at vercel.app URL
- [ ] Can connect to backend
- [ ] Can register/login
- [ ] Can create trades
- [ ] Custom domain configured (optional)

Happy trading! 🎉
