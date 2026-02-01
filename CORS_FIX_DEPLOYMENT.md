# CORS Fix Deployment Guide

## Issue
Frontend at `https://chottola-e-commerce-website-fronten.vercel.app` cannot access backend at `https://chottola-e-commerce-website-git-613bf5-mohammad-rahims-projects.vercel.app/api` due to CORS policy.

## Changes Made

### Backend Changes
1. Updated `backend/vercel.json` - Added CORS headers configuration
2. Updated `backend/server.js` - Added manual CORS middleware for Vercel compatibility

### Frontend Changes
1. Updated `frontend/src/services/api.js` - Fixed API URL configuration and added `withCredentials: true`
2. Created environment files:
   - `.env.local` - For local development
   - `.env.production` - For production deployment
   - `.env.example` - Template for developers

## Deployment Steps

### Step 1: Deploy Backend Changes

```bash
# Commit and push backend changes
git add backend/
git commit -m "Fix CORS configuration for Vercel deployment"
git push origin main
```

Wait for backend deployment to complete on Vercel (1-2 minutes).

### Step 2: Configure Vercel Environment Variables

#### For Backend Project:
Go to your backend Vercel project settings and ensure these variables are set:
- `NODE_ENV` = `production`
- `MONGODB_URI` = (your MongoDB connection string)
- `JWT_SECRET` = (your JWT secret)
- Any other required environment variables

#### For Frontend Project:
Go to your frontend Vercel project settings:
1. Go to Settings → Environment Variables
2. Add this variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://chottola-e-commerce-website-git-613bf5-mohammad-rahims-projects.vercel.app/api`
   - **Environment**: Production

### Step 3: Deploy Frontend Changes

```bash
# Commit and push frontend changes
git add frontend/
git commit -m "Fix API URL configuration and add environment variables"
git push origin main
```

### Step 4: Redeploy Frontend
After adding the environment variable in Vercel:
1. Go to your frontend deployment on Vercel
2. Click "Redeploy" to trigger a new build with the environment variable

### Step 5: Verify the Fix
After both deployments complete:
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Visit your frontend URL
3. Open DevTools Console
4. Check if API requests are successful

## Alternative: Quick Fix Without Environment Variables

If you don't want to set environment variables in Vercel, the code will fallback to the hardcoded URL in `api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 
  'https://chottola-e-commerce-website-git-613bf5-mohammad-rahims-projects.vercel.app/api';
```

Just deploy the changes and it should work.

## Testing Locally

To test locally before deploying:

1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will use `http://localhost:5000/api` from `.env.local`.

## Troubleshooting

### If CORS errors persist:

1. **Check backend deployment logs** in Vercel for any errors
2. **Verify CORS headers** by checking network tab:
   - Response should include `Access-Control-Allow-Origin: *`
3. **Clear Vercel cache**:
   - Redeploy with "Force Rebuild" option
4. **Check browser cache**:
   - Hard refresh (Ctrl+Shift+R)
   - Clear site data in DevTools

### If environment variable is not working:

1. Ensure `VITE_API_URL` is set in Vercel (must start with `VITE_`)
2. Redeploy after adding the variable
3. Check build logs to ensure variable is being used

## Security Note

Currently using `Access-Control-Allow-Origin: *` which allows all origins.

For production security, update `backend/middleware/security.js`:

```javascript
origin: function (origin, callback) {
  const allowedOrigins = [
    'https://chottola-e-commerce-website-fronten.vercel.app',
    'https://your-custom-domain.com'
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

And update `backend/vercel.json` to set specific origin.
