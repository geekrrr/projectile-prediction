# 🚀 Deployment Guide - Ballistic Studio

## Complete Step-by-Step Hosting Instructions

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ All code committed to GitHub repository
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))

---

## 🎯 Deployment Strategy

```
Step 1: Deploy Backend to Render    (10 minutes)
        ↓
Step 2: Get Backend API URL
        ↓
Step 3: Deploy Frontend to Vercel   (5 minutes)
        ↓
Step 4: Update CORS Settings         (2 minutes)
        ↓
Step 5: Test & Verify                (5 minutes)
```

---

## 🔧 PART 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
# In your project root (S:\Ballistic_MPI)
git add .
git commit -m "Add deployment configs for Render and Vercel"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `ballistic-api` (or your choice) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

5. Select **Free** plan
6. Click **"Advanced"** and add environment variables:

```
PORT = 8000
PYTHON_VERSION = 3.10
```

7. Click **"Create Web Service"**

### Step 3: Wait for Build

- Render will automatically build your backend
- This takes 5-10 minutes
- Watch the logs for any errors
- Once done, you'll see: ✅ **"Live"** status

### Step 4: Get Your Backend URL

- Copy the URL shown (e.g., `https://ballistic-api.onrender.com`)
- **SAVE THIS URL** - you'll need it for frontend deployment

---

## 🎨 PART 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add **Environment Variables**:

```
VITE_API_URL = https://ballistic-api.onrender.com
```
(Use YOUR Render URL from Part 1, Step 4)

6. Click **"Deploy"**

### Step 2: Wait for Deployment

- Vercel builds in 2-3 minutes
- Once complete, you'll get a URL like: `https://your-app.vercel.app`

### Step 3: Test Your Frontend

- Click the deployment URL
- Try running a simulation
- Check if API calls work

---

## 🔗 PART 3: Connect Frontend & Backend (CORS)

### Update Backend CORS Settings

1. Go back to Render dashboard
2. Click your web service
3. Go to **"Environment"** tab
4. Add new environment variable:

```
FRONTEND_URL = https://your-app.vercel.app
```
(Use YOUR Vercel URL from Part 2)

5. Click **"Save Changes"**
6. Render will automatically redeploy (2-3 minutes)

---

## ✅ PART 4: Verification Checklist

Test these features on your live site:

- [ ] **Home Page Loads** - Purple gradient background visible
- [ ] **Run Simulation** - Enter v0=300, angle=45, click Calculate
- [ ] **View Trajectory** - Animation appears
- [ ] **Check Analytics** - Charts display data
- [ ] **Ballistic Page** - Missile presets load
- [ ] **About Page** - Landing page displays correctly
- [ ] **Mobile View** - Test on phone/tablet

### Test API Directly

Open in browser: `https://your-render-url.onrender.com/health`

Should return:
```json
{
  "status": "ok",
  "model_loaded": true,
  "api_version": "1.0.0"
}
```

---

## 🎉 SUCCESS! Your App is Live

**Frontend URL:** `https://your-app.vercel.app`
**Backend API:** `https://your-api.onrender.com`
**API Docs:** `https://your-api.onrender.com/docs`

---

## 🔄 Making Updates After Deployment

### To Update Code:

```bash
# Make your changes
git add .
git commit -m "Update description"
git push origin main
```

**Auto-deploys:**
- ✅ Vercel: Redeploys automatically on push (2-3 min)
- ✅ Render: Redeploys automatically on push (5-10 min)

---

## ⚙️ Optional: Custom Domain

### For Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `ballistic.yourname.com`)
3. Update DNS records as shown

### For Render (Backend):
1. Go to Settings → Custom Domain
2. Add API subdomain (e.g., `api.ballistic.yourname.com`)
3. Update DNS records

---

## 🐛 Troubleshooting

### Backend Issues:

**Build fails:**
- Check `requirements.txt` is in `backend/` folder
- Verify Python version in `runtime.txt`
- Check Render logs for specific errors

**API not responding:**
- Ensure start command is correct
- Check PORT environment variable is set
- Verify models folder is included in git

### Frontend Issues:

**Blank page:**
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Try rebuilding: Settings → Deployments → Redeploy

**API calls fail:**
- Check CORS settings in backend
- Verify `FRONTEND_URL` matches Vercel URL exactly
- Check browser network tab for 403/500 errors

---

## 💰 Free Tier Limits

### Render Free Plan:
- ✅ 750 hours/month
- ✅ Sleeps after 15 min inactivity (wakes on request)
- ✅ 512 MB RAM
- ✅ Shared CPU

### Vercel Hobby Plan:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Custom domains
- ✅ Automatic HTTPS

---

## 📞 Support

**Issues?** Check:
- [Render Status](https://status.render.com/)
- [Vercel Status](https://www.vercel-status.com/)
- Your API logs in Render dashboard
- Browser developer console

---

## 🎓 What You've Accomplished

- ✅ Full-stack app deployed to production
- ✅ Automatic HTTPS/SSL certificates
- ✅ Auto-deploy on git push
- ✅ Global CDN distribution
- ✅ Professional hosting infrastructure

**Total Cost: $0/month** 🎉

---

*Last Updated: December 16, 2025*
*Ballistic Studio v1.0.0*
