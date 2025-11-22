# Vercel Deployment Guide for JalaDhar

This guide will help you deploy the JalaDhar project to Vercel.

## Project Structure

- **Frontend**: React + Vite application in `JalaDhar/Frontend/`
- **Backend**: Express.js API in `JalaDhar/Backend/`

## Deployment Options

### Option 1: Deploy Frontend and Backend Separately (Recommended)

#### Frontend Deployment

1. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Set **Root Directory** to `JalaDhar/Frontend`

2. **Build Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Environment Variables**:
   Add the following environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
   ```

4. **Deploy**: Click "Deploy"

#### Backend Deployment

1. **Connect to Vercel**:
   - Create a new project in Vercel Dashboard
   - Import the same Git repository
   - Set **Root Directory** to `JalaDhar/Backend`

2. **Build Settings**:
   - Framework Preset: Other
   - Build Command: Leave empty (or `npm install`)
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Environment Variables**:
   Add all variables from `Backend/env.example`:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRE=30d
   FRONTEND_URL=https://your-frontend-url.vercel.app
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM="JalaDhar <noreply@jaladhar.com>"
   ADMIN_REGISTRATION_CODE=your-secure-code
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   FAKE_PAYMENT_MODE=false
   ```

4. **Deploy**: Click "Deploy"

### Option 2: Deploy as Monorepo (Single Project)

If you want to deploy both frontend and backend in a single Vercel project:

1. Create a `vercel.json` in the root `JalaDhar/` directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "Frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "Backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/Backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/Frontend/$1"
    }
  ]
}
```

2. Update `Frontend/package.json` to add a build script that outputs to the correct directory.

## Important Notes

### Frontend Environment Variables

- `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://jaladhar-api.vercel.app/api`)

### Backend Environment Variables

All variables from `Backend/env.example` must be set in Vercel's environment variables section.

### CORS Configuration

Make sure `FRONTEND_URL` in backend environment variables matches your frontend Vercel URL.

### MongoDB

- Use MongoDB Atlas for production
- Update `MONGODB_URI` with your Atlas connection string

### File Uploads

- Cloudinary is configured for file uploads
- Make sure Cloudinary credentials are set in environment variables

### Socket.IO

If you're using Socket.IO, you may need to configure it for serverless functions. Consider using Vercel's serverless functions or a separate service for WebSocket connections.

## Post-Deployment

1. **Update Frontend API URL**: After backend deployment, update `VITE_API_BASE_URL` in frontend environment variables
2. **Test Health Endpoint**: Visit `https://your-backend-url.vercel.app/health`
3. **Test Frontend**: Visit your frontend URL and test all features

## Troubleshooting

### Build Errors

- Check Node.js version (Vercel uses Node 18.x by default)
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Errors

- Verify environment variables are set correctly
- Check CORS configuration matches frontend URL
- Verify MongoDB connection string is correct

### 404 Errors on Frontend Routes

- Ensure `vercel.json` has the rewrite rule for SPA routing
- Check that `index.html` is in the correct location

## Support

For more information, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

