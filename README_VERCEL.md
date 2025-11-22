# Quick Vercel Deployment Guide

## 🚀 Quick Start

### Step 1: Deploy Backend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. **Root Directory**: Set to `JalaDhar/Backend`
5. **Framework Preset**: Other
6. **Build Command**: Leave empty
7. **Output Directory**: Leave empty
8. **Install Command**: `npm install`

#### Environment Variables (Backend)
Add all these in Vercel's Environment Variables section:

```
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://your-frontend-url.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-secret
ADMIN_REGISTRATION_CODE=your-secure-code
```

9. Click **"Deploy"**
10. Copy the deployment URL (e.g., `https://jaladhar-api.vercel.app`)

### Step 2: Deploy Frontend

1. Create a **new project** in Vercel Dashboard
2. Import the **same Git repository**
3. **Root Directory**: Set to `JalaDhar/Frontend`
4. **Framework Preset**: Vite (auto-detected)
5. **Build Command**: `npm run build` (auto-detected)
6. **Output Directory**: `dist` (auto-detected)

#### Environment Variables (Frontend)
Add this variable:

```
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Step 1.

7. Click **"Deploy"**

### Step 3: Update Backend CORS

1. Go back to your **Backend project** in Vercel
2. Go to **Settings** → **Environment Variables**
3. Update `FRONTEND_URL` to match your frontend URL
4. **Redeploy** the backend

## ✅ Verification

1. **Backend Health Check**: Visit `https://your-backend-url.vercel.app/health`
2. **Frontend**: Visit your frontend URL and test login/features

## 📝 Important Notes

- **MongoDB**: Use MongoDB Atlas (free tier available)
- **Cloudinary**: Sign up at cloudinary.com for image uploads
- **Razorpay**: Get keys from razorpay.com dashboard
- **Email**: Use Gmail App Password for email service

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version (Vercel uses Node 18.x)
- Verify all dependencies in `package.json`

### API Not Working
- Check `VITE_API_BASE_URL` matches backend URL
- Verify CORS settings in backend
- Check environment variables are set correctly

### 404 on Frontend Routes
- Verify `vercel.json` has SPA rewrite rule
- Check build output directory is `dist`

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT.md` for detailed information.

