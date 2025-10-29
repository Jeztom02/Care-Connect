# 🚀 Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code is committed to Git
- [ ] `.env` files are NOT committed (check `.gitignore`)
- [ ] Dependencies are up to date (`npm install` in both root and server)
- [ ] Build commands work locally:
  - [ ] Frontend: `npm run build` (creates `dist` folder)
  - [ ] Backend: `cd server && npm run build` (creates `dist` folder)
- [ ] No TypeScript errors: `npm run lint`

### 2. Database Setup (MongoDB Atlas)
- [ ] MongoDB Atlas account created
- [ ] Free cluster created (M0 tier)
- [ ] Database user created with read/write permissions
- [ ] Network access set to `0.0.0.0/0` (allow from anywhere)
- [ ] Connection string copied and saved securely
- [ ] Database name added to connection string (e.g., `/compassion`)

### 3. GitHub Repository
- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] Repository is public or Render has access
- [ ] All necessary files are included

### 4. Environment Variables Prepared
Prepare these values before deployment:

#### Backend Required:
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Random 32+ character string
- [ ] `SESSION_SECRET` - Random 32+ character string
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `10000`

#### Backend Optional:
- [ ] `GOOGLE_CLIENT_ID` - For Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - For Google OAuth
- [ ] `GOOGLE_CALLBACK_URL` - Backend URL + `/api/auth/google/callback`
- [ ] `EMAIL_HOST` - SMTP server (e.g., `smtp.gmail.com`)
- [ ] `EMAIL_PORT` - SMTP port (e.g., `587`)
- [ ] `EMAIL_USER` - Email address
- [ ] `EMAIL_PASS` - Email password or app password
- [ ] `AWS_ACCESS_KEY_ID` - For file uploads
- [ ] `AWS_SECRET_ACCESS_KEY` - For file uploads
- [ ] `AWS_REGION` - AWS region
- [ ] `AWS_S3_BUCKET` - S3 bucket name

#### Frontend Required:
- [ ] `VITE_API_URL` - Backend URL (will be set after backend deployment)

---

## 🔧 Deployment Steps

### Step 1: Deploy Backend
- [ ] Log in to [Render Dashboard](https://dashboard.render.com)
- [ ] Click **New +** → **Web Service**
- [ ] Connect GitHub repository
- [ ] Configure service:
  - [ ] Name: `compassion-backend`
  - [ ] Runtime: Node
  - [ ] Build Command: `cd server && npm install && npm run build`
  - [ ] Start Command: `cd server && npm start`
- [ ] Add all environment variables
- [ ] Click **Create Web Service**
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy backend URL (e.g., `https://compassion-backend.onrender.com`)
- [ ] Test health endpoint: `https://YOUR-BACKEND-URL/api/health`

### Step 2: Deploy Frontend
- [ ] In Render Dashboard, click **New +** → **Static Site**
- [ ] Select same GitHub repository
- [ ] Configure service:
  - [ ] Name: `compassion-frontend`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL` = Your backend URL
- [ ] Click **Create Static Site**
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy frontend URL (e.g., `https://compassion-frontend.onrender.com`)

### Step 3: Update Backend ORIGIN
- [ ] Go to backend service in Render
- [ ] Click **Environment** tab
- [ ] Update `ORIGIN` variable to frontend URL
- [ ] Save changes (backend will auto-redeploy)

### Step 4: Configure Google OAuth (if using)
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Navigate to **APIs & Services** → **Credentials**
- [ ] Update OAuth 2.0 Client:
  - [ ] Add authorized redirect URI: `https://YOUR-BACKEND-URL/api/auth/google/callback`
  - [ ] Add authorized JavaScript origin: `https://YOUR-FRONTEND-URL`
- [ ] Save changes

### Step 5: Seed Database (optional)
- [ ] Go to backend service in Render
- [ ] Click **Shell** tab
- [ ] Run: `cd server && npm run seed`
- [ ] Verify users created in MongoDB Atlas

---

## ✅ Post-Deployment Testing

### Backend Tests
- [ ] Health check: `https://YOUR-BACKEND-URL/api/health`
- [ ] Debug endpoint: `https://YOUR-BACKEND-URL/api/auth/debug`
- [ ] CORS working (no errors in browser console)
- [ ] Database connected (check logs)

### Frontend Tests
- [ ] Landing page loads
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard accessible after login
- [ ] API calls successful (check Network tab)
- [ ] No CORS errors
- [ ] Google OAuth works (if configured)

### Feature Tests
- [ ] User registration and login
- [ ] Patient management
- [ ] Appointment scheduling
- [ ] Messaging system
- [ ] Medical records
- [ ] Prescriptions
- [ ] Emergency alerts
- [ ] File uploads (if AWS configured)
- [ ] Email notifications (if SMTP configured)

---

## 🔍 Troubleshooting

### Backend Issues
- [ ] Check logs in Render Dashboard
- [ ] Verify all environment variables are set
- [ ] Test MongoDB connection using Compass
- [ ] Check build logs for errors
- [ ] Ensure start command is correct

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify `VITE_API_URL` is correct
- [ ] Check Network tab for failed requests
- [ ] Ensure backend is running
- [ ] Clear browser cache and cookies

### CORS Issues
- [ ] Verify `ORIGIN` in backend matches frontend URL
- [ ] Check CORS configuration in `server/src/index.ts`
- [ ] Ensure `withCredentials: true` in frontend API calls

### Database Issues
- [ ] Check MongoDB Atlas IP whitelist
- [ ] Verify database user credentials
- [ ] Test connection string format
- [ ] Check database name in connection string

---

## 📊 Monitoring

### Daily Checks
- [ ] Check Render logs for errors
- [ ] Monitor response times
- [ ] Check database storage usage
- [ ] Review error reports

### Weekly Checks
- [ ] Review security logs
- [ ] Check for dependency updates
- [ ] Monitor user feedback
- [ ] Review performance metrics

---

## 🔄 Updating Your Application

### Making Changes
1. [ ] Make code changes locally
2. [ ] Test locally
3. [ ] Commit changes to Git
4. [ ] Push to GitHub
5. [ ] Render auto-deploys (or manual deploy)
6. [ ] Test in production

### Manual Redeploy
- [ ] Go to service in Render Dashboard
- [ ] Click **Manual Deploy** → **Deploy latest commit**

---

## 💡 Tips for Success

### Performance
- [ ] Enable caching where appropriate
- [ ] Optimize images and assets
- [ ] Use CDN for static assets
- [ ] Monitor API response times

### Security
- [ ] Use strong secrets (32+ characters)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Restrict CORS to specific origins
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets

### Cost Optimization
- [ ] Use free tier for testing
- [ ] Upgrade to paid tier for production
- [ ] Monitor usage and costs
- [ ] Optimize database queries

---

## 📞 Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)
- [Project GitHub Issues](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)

---

## ✨ Success Criteria

Your deployment is successful when:
- [ ] Both frontend and backend are accessible
- [ ] Users can register and login
- [ ] All features work as expected
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] Security best practices followed

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Backend URL**: _________________

**Frontend URL**: _________________

**Notes**: 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
