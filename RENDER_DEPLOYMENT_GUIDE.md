# Render Deployment Guide - Care Connect Application

This guide will walk you through deploying your full-stack Care Connect application to Render.

## 📋 Prerequisites

Before starting, ensure you have:
- A [Render account](https://render.com) (free tier available)
- A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) for the database (free tier available)
- Your GitHub repository connected to Render
- Google OAuth credentials (if using Google Sign-In)
- AWS S3 credentials (if using file uploads)
- SMTP credentials (if using email features)

---

## 🚀 Step-by-Step Deployment Process

### Step 1: Set Up MongoDB Atlas (Database)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Free tier is sufficient)

2. **Configure Database Access**
   - Go to **Database Access** in the left sidebar
   - Click **Add New Database User**
   - Create a username and strong password
   - Set privileges to **Read and write to any database**
   - Click **Add User**

3. **Configure Network Access**
   - Go to **Network Access** in the left sidebar
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Click **Confirm**

4. **Get Connection String**
   - Go to **Database** in the left sidebar
   - Click **Connect** on your cluster
   - Choose **Connect your application**
   - Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual database password
   - Add your database name before the `?` (e.g., `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/compassion?retryWrites=true&w=majority`)

---

### Step 2: Push Code to GitHub

1. **Initialize Git Repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   ```

2. **Create GitHub Repository**
   - Go to [GitHub](https://github.com)
   - Click **New Repository**
   - Name it (e.g., `compassion-care-connect`)
   - Don't initialize with README (you already have one)
   - Click **Create Repository**

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 3: Deploy Backend to Render

1. **Log in to Render Dashboard**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New +** → **Web Service**

2. **Connect GitHub Repository**
   - Click **Connect GitHub** (if not already connected)
   - Select your repository
   - Click **Connect**

3. **Configure Backend Service**
   - **Name**: `compassion-backend` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or specify if needed)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     cd server && npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     cd server && npm start
     ```
   - **Plan**: Free (or choose paid plan for better performance)

4. **Add Environment Variables**
   Click **Advanced** → **Add Environment Variable** and add the following:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Required |
   | `PORT` | `10000` | Render default |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Generate random string | Use: `openssl rand -base64 32` |
   | `SESSION_SECRET` | Generate random string | Use: `openssl rand -base64 32` |
   | `ORIGIN` | `https://YOUR-FRONTEND-URL.onrender.com` | Will update after frontend deployment |
   | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | Optional |
   | `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret | Optional |
   | `GOOGLE_CALLBACK_URL` | `https://YOUR-BACKEND-URL.onrender.com/api/auth/google/callback` | Optional |
   | `EMAIL_HOST` | `smtp.gmail.com` | Optional (for password reset) |
   | `EMAIL_PORT` | `587` | Optional |
   | `EMAIL_SECURE` | `false` | Optional |
   | `EMAIL_USER` | Your email | Optional |
   | `EMAIL_PASS` | App password | Optional |
   | `MAIL_FROM` | `"Care Connect <no-reply@yourapp.com>"` | Optional |
   | `AWS_ACCESS_KEY_ID` | Your AWS key | Optional (for file uploads) |
   | `AWS_SECRET_ACCESS_KEY` | Your AWS secret | Optional |
   | `AWS_REGION` | `us-east-1` | Optional |
   | `AWS_S3_BUCKET` | Your bucket name | Optional |

5. **Deploy Backend**
   - Click **Create Web Service**
   - Wait for deployment to complete (5-10 minutes)
   - Copy your backend URL (e.g., `https://compassion-backend.onrender.com`)

6. **Test Backend**
   - Visit: `https://YOUR-BACKEND-URL.onrender.com/api/health`
   - You should see: `{"status":"ok","uptime":...}`

---

### Step 4: Deploy Frontend to Render

1. **Create New Static Site**
   - In Render Dashboard, click **New +** → **Static Site**
   - Select your GitHub repository
   - Click **Connect**

2. **Configure Frontend Service**
   - **Name**: `compassion-frontend` (or your preferred name)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

3. **Add Environment Variables**
   Click **Advanced** → **Add Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-BACKEND-URL.onrender.com` |

4. **Deploy Frontend**
   - Click **Create Static Site**
   - Wait for deployment to complete (5-10 minutes)
   - Copy your frontend URL (e.g., `https://compassion-frontend.onrender.com`)

---

### Step 5: Update Backend ORIGIN Variable

1. **Go to Backend Service**
   - In Render Dashboard, click on your backend service
   - Go to **Environment** tab

2. **Update ORIGIN Variable**
   - Find the `ORIGIN` environment variable
   - Update it to your frontend URL: `https://YOUR-FRONTEND-URL.onrender.com`
   - Click **Save Changes**
   - The backend will automatically redeploy

---

### Step 6: Update Google OAuth Callback URLs (Optional)

If you're using Google OAuth:

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Select your project

2. **Update OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     - `https://YOUR-BACKEND-URL.onrender.com/api/auth/google/callback`
   - Under **Authorized JavaScript origins**, add:
     - `https://YOUR-FRONTEND-URL.onrender.com`
   - Click **Save**

---

### Step 7: Seed the Database (Optional)

1. **Connect to Backend Shell**
   - In Render Dashboard, go to your backend service
   - Click **Shell** tab
   - Run:
     ```bash
     cd server && npm run seed
     ```

2. **Or Use MongoDB Compass**
   - Download [MongoDB Compass](https://www.mongodb.com/products/compass)
   - Connect using your MongoDB URI
   - Manually create test users and data

---

### Step 8: Test Your Application

1. **Visit Frontend URL**
   - Go to `https://YOUR-FRONTEND-URL.onrender.com`
   - You should see the landing page

2. **Test Registration**
   - Click **Register**
   - Create a new account
   - Verify email functionality (if configured)

3. **Test Login**
   - Log in with your credentials
   - Test different user roles

4. **Test API Endpoints**
   - Check that all features work (appointments, messages, etc.)
   - Monitor logs in Render Dashboard

---

## 🔧 Configuration Files Created

### `render.yaml`
This file contains the infrastructure-as-code configuration for both services. Render will automatically detect and use this file.

---

## 🎯 Important Notes

### Free Tier Limitations
- **Backend**: Spins down after 15 minutes of inactivity (first request may be slow)
- **Frontend**: Always available (static site)
- **Database**: MongoDB Atlas free tier has 512MB storage limit

### Security Best Practices
1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT_SECRET and SESSION_SECRET
3. **Enable HTTPS** - Render provides this automatically
4. **Restrict CORS** - Set specific origins in production
5. **Use environment variables** - Never hardcode sensitive data

### Performance Optimization
1. **Keep backend warm** - Consider using a cron job to ping your backend every 14 minutes
2. **Enable caching** - Frontend is automatically cached by Render CDN
3. **Optimize images** - Compress images before uploading
4. **Monitor logs** - Check Render logs for errors

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check logs in Render Dashboard
- Verify all environment variables are set
- Ensure MongoDB URI is correct
- Check build command completed successfully

### Frontend Shows Blank Page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend is running and accessible
- Check CORS settings in backend

### Database Connection Failed
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user credentials
- Ensure connection string includes database name
- Test connection using MongoDB Compass

### CORS Errors
- Update `ORIGIN` in backend environment variables
- Add frontend URL to allowed origins
- Check that credentials are enabled in CORS config

### Google OAuth Not Working
- Verify Google Cloud Console redirect URIs
- Check `GOOGLE_CALLBACK_URL` environment variable
- Ensure frontend URL is in authorized origins

---

## 📊 Monitoring & Maintenance

### View Logs
- Go to Render Dashboard
- Click on your service
- Click **Logs** tab
- Monitor for errors and warnings

### Update Application
1. Push changes to GitHub
2. Render will automatically detect and redeploy
3. Monitor deployment progress in dashboard

### Manual Redeploy
- Go to service in Render Dashboard
- Click **Manual Deploy** → **Deploy latest commit**

---

## 💰 Upgrading to Paid Plans

For production use, consider upgrading:
- **Backend**: Starter plan ($7/month) - Always on, no cold starts
- **Database**: MongoDB Atlas M10+ - Better performance and storage
- **Custom Domain**: Free with any paid plan

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user and network access configured
- [ ] Code pushed to GitHub
- [ ] Backend service created on Render
- [ ] All backend environment variables set
- [ ] Backend deployed successfully
- [ ] Frontend service created on Render
- [ ] Frontend environment variables set
- [ ] Frontend deployed successfully
- [ ] Backend ORIGIN updated with frontend URL
- [ ] Google OAuth credentials updated (if applicable)
- [ ] Database seeded with initial data
- [ ] Application tested end-to-end
- [ ] Monitoring and logs reviewed

---

## 🎉 Success!

Your Care Connect application is now live on Render! Share your URLs:
- **Frontend**: `https://YOUR-FRONTEND-URL.onrender.com`
- **Backend API**: `https://YOUR-BACKEND-URL.onrender.com`

For support, check the Render community forum or documentation.
