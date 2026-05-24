# Railway Deployment Guide

Deploy your Khanyisa backend to Railway.app (free tier available)

## 🚀 Quick Start

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub (recommended)
- Create new project

### 2. Setup Database (PostgreSQL on Railway)

In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Wait for database to be created
3. Copy connection string (click on PostgreSQL service → Variables)
4. Note the `DATABASE_URL`

### 3. Deploy Backend

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub
   ```bash
   git add .
   git commit -m "Add backend and deployment config"
   git push
   ```

2. In Railway dashboard:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Select the branch

3. Railway auto-detects Node.js project

#### Option B: Deploy from CLI

1. Install Railway CLI
   ```bash
   npm install -g @railway/cli
   ```

2. Login
   ```bash
   railway login
   ```

3. Initialize project
   ```bash
   railway init
   ```

4. Create new environment
   ```bash
   railway env add NODE_ENV production
   railway env add DATABASE_URL postgresql://...
   ```

5. Deploy
   ```bash
   railway up --detach
   ```

### 4. Configure Environment Variables

In Railway dashboard (Backend service):

**Go to: Service → Variables tab**

Add these variables:
```
NODE_ENV=production
PORT=5000
DB_HOST=your_pg_host
DB_PORT=5432
DB_NAME=khanyisa
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:password@host:5432/khanyisa
JWT_SECRET=your_super_secret_key_change_this
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 5. Initialize Database Schema

1. Get your backend URL (Railway generates: `https://xxx.railway.app`)

2. Run setup script (after backend deployment):
   ```bash
   curl -X POST https://xxx.railway.app/api/setup
   # Or run locally:
   npm run setup-db
   ```

### 6. Verify Deployment

1. Test health check:
   ```bash
   curl https://xxx.railway.app/health
   ```

2. Should return:
   ```json
   {
     "status": "Backend is running",
     "timestamp": "2026-05-01T10:00:00Z"
   }
   ```

3. Test register endpoint:
   ```bash
   curl -X POST https://xxx.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User"
     }'
   ```

---

## 📊 Railway Pricing

**Free tier includes:**
- 5 GB PostgreSQL database
- Deployment hours (limited)
- Custom domains

**Premium ($5/month):**
- Unlimited deployment hours
- More database storage
- Priority support

---

## 🔄 Deployment Updates

### Update Backend Code

Option A (from Git):
```bash
git push  # Railway auto-deploys
```

Option B (from CLI):
```bash
railway up --detach
```

### Rollback if Issues

Railway keeps deployment history:
1. Dashboard → Deployments
2. Click on previous deployment
3. Select "Redeploy"

---

## 📝 Managing Deployments

### View Logs
```bash
railway logs
```

### Check Status
```bash
railway status
```

### Stop Service
```bash
railway down
```

### Delete Project
```bash
railway delete
```

---

## 🚨 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct in Variables
- Verify PostgreSQL service exists
- Ensure firewall allows Railway apps to connect

### "502 Bad Gateway"
- Check backend logs: `railway logs`
- Verify PORT is set to 5000
- Check DATABASE_URL is valid

### "Schema not created"
- SSH into container or run setup locally
- `npm run setup-db`
- Verify database exists

### "CORS error from frontend"
- Update FRONTEND_URL variable with actual Vercel URL
- Restart backend service

---

## 📚 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- PostgreSQL Connection: https://railway.app/docs/databases/postgresql
- Environment Variables: https://railway.app/docs/deploy/environment-variables
- CLI Reference: https://railway.app/docs/cli/commands

---

## 🎯 Next Steps

1. ✅ Database created
2. ✅ Backend deployed
3. ➡️ Deploy frontend to Vercel
4. ➡️ Connect frontend to backend
5. ➡️ Set up domain (optional)

---

## Your Production URLs

**Backend API:**
```
https://xxx.railway.app
```

**Database:**
```
postgresql://postgres:xxx@xxx.railway.app:5432/khanyisa
```

**Register new user:**
```
POST https://xxx.railway.app/api/auth/register
```

**Login user:**
```
POST https://xxx.railway.app/api/auth/login
```

**Get trades:**
```
GET https://xxx.railway.app/api/trades
Authorization: Bearer <token>
```

Update your frontend `.env.production` with the Railway backend URL!

---

Happy trading! 🚀
