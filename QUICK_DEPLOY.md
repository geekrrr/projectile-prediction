# 🚀 Quick Deployment Reference Card

## RENDER (Backend) Configuration

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Root Directory:** `backend`

**Environment Variables:**
```
PORT = 8000
PYTHON_VERSION = 3.10
FRONTEND_URL = [ADD YOUR VERCEL URL AFTER FRONTEND DEPLOYS]
```

---

## VERCEL (Frontend) Configuration

**Framework:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

**Environment Variables:**
```
VITE_API_URL = [ADD YOUR RENDER URL AFTER BACKEND DEPLOYS]
```

---

## Deployment Order

1. ✅ **Backend First** (Render) → Get API URL
2. ✅ **Frontend Second** (Vercel) → Use backend URL
3. ✅ **Update CORS** (Render) → Add frontend URL

---

## URLs After Deployment

**Backend API:** `https://[your-service-name].onrender.com`
**Frontend App:** `https://[your-project-name].vercel.app`
**API Docs:** `https://[your-service-name].onrender.com/docs`

---

## Git Commands Before Deployment

```bash
git add .
git commit -m "Production deployment - Dec 16, 2025"
git push origin main
```
