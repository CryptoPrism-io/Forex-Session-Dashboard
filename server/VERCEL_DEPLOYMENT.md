# Vercel Backend Deployment Guide

This backend is configured to run on **Vercel Serverless Functions**.

## Prerequisites

1. Vercel account (free at https://vercel.com)
2. GitHub account with this repository
3. PostgreSQL credentials (already configured)

## Deployment Steps

### 1. Create New Vercel Project

```bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel

# Option B: Via Vercel Dashboard
# Go to https://vercel.com/new
# Select "Other" → Import from Git → Select this repo
```

### 2. Select Root Directory

During import, set:
- **Root Directory**: `server` (the folder containing vercel.json and /api)

### 3. Add Environment Variables in Vercel Dashboard

Go to **Project Settings** → **Environment Variables** and add:

```
POSTGRES_HOST = 34.55.195.199
POSTGRES_PORT = 5432
POSTGRES_DB = dbcp
POSTGRES_USER = yogass09
POSTGRES_PASSWORD = jaimaakamakhya
POSTGRES_POOL_SIZE = 5
```

⚠️ **Security Note**: These are now in Vercel's encrypted environment. Don't commit the .env file!

### 4. Deploy

```bash
# If using Vercel CLI
vercel --prod

# Or just push to GitHub and it auto-deploys
git push origin main
```

### 5. Get Your Backend URL

After deployment, Vercel gives you a URL like:
```
https://your-project-name.vercel.app
```

Your API endpoints will be:
- Health: `https://your-project-name.vercel.app/api/health`
- Events: `https://your-project-name.vercel.app/api/calendar/events`
- Stats: `https://your-project-name.vercel.app/api/calendar/stats`
- Currencies: `https://your-project-name.vercel.app/api/calendar/currencies`

## Update Frontend

Once you have the Vercel backend URL, update the frontend:

1. **Edit vite.config.ts:**
```typescript
// Add this to the define section:
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
    mode === 'production'
      ? 'https://your-project-name.vercel.app'
      : 'http://localhost:5000'
  )
}
```

2. **Or set it in Vercel frontend (if using Vercel for frontend too)**

## Testing

```bash
# Test health endpoint
curl https://your-project-name.vercel.app/api/health

# Test events endpoint
curl "https://your-project-name.vercel.app/api/calendar/events?startDate=2025-11-10&endDate=2025-11-10"
```

## Troubleshooting

### Getting "Offline" or JSON errors in frontend?
- Check that `VITE_API_BASE_URL` is set correctly in vite.config.ts
- Verify Vercel environment variables are saved
- Check Vercel deployment logs: `vercel logs`

### Database connection fails?
- Verify environment variables in Vercel dashboard
- Check PostgreSQL is accessible from Vercel (it should be public)
- Test locally first: `npm run dev` in /server

### Cold starts taking too long?
- Vercel serverless functions can have ~1-2s cold start
- First request after idle will be slower
- Configure this in vercel.json if needed

## Notes

- Each API route is a separate serverless function
- Database connections are pooled automatically
- No need to manage running servers
- Auto-scales based on traffic
- All data is encrypted in transit and at rest
