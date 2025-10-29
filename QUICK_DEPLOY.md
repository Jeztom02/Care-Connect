# ⚡ Quick Deploy Guide - 5 Minutes

## Prerequisites
- GitHub account
- Render account (free)
- MongoDB Atlas account (free)

---

## 🚀 5-Step Deployment

### 1️⃣ Setup MongoDB (2 minutes)
```
1. Go to mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Allow IP: 0.0.0.0/0
5. Copy connection string
```

### 2️⃣ Push to GitHub (1 minute)
```bash
git init
git add .
git commit -m "Deploy to Render"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### 3️⃣ Deploy Backend (1 minute)
```
1. render.com → New Web Service
2. Connect GitHub repo
3. Name: compassion-backend
4. Build: cd server && npm install && npm run build
5. Start: cd server && npm start
6. Add env vars (see below)
7. Create
```

**Required Environment Variables:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=generate_random_32_chars
SESSION_SECRET=generate_random_32_chars
NODE_ENV=production
PORT=10000
ORIGIN=https://YOUR-FRONTEND-URL.onrender.com
```

### 4️⃣ Deploy Frontend (1 minute)
```
1. render.com → New Static Site
2. Same GitHub repo
3. Name: compassion-frontend
4. Build: npm install && npm run build
5. Publish: dist
6. Add env var: VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
7. Create
```

### 5️⃣ Update Backend ORIGIN
```
1. Go to backend service
2. Environment tab
3. Update ORIGIN to frontend URL
4. Save (auto-redeploys)
```

---

## ✅ Test
- Frontend: `https://YOUR-FRONTEND-URL.onrender.com`
- Backend: `https://YOUR-BACKEND-URL.onrender.com/api/health`

---

## 🔑 Generate Secrets
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use: https://randomkeygen.com/
```

---

## 📝 Notes
- Free tier: Backend sleeps after 15 min inactivity
- First request may be slow (cold start)
- See RENDER_DEPLOYMENT_GUIDE.md for details

---

## 🐛 Common Issues

**CORS Error?**
- Update ORIGIN in backend to match frontend URL

**Database Connection Failed?**
- Check MongoDB Atlas IP whitelist (0.0.0.0/0)
- Verify connection string includes database name

**Frontend Blank?**
- Check VITE_API_URL is set correctly
- Check browser console for errors

---

## 📚 Full Documentation
See `RENDER_DEPLOYMENT_GUIDE.md` for complete instructions.
