# GCP Cloud Run Deployment - Quick Checklist

## Pre-Deployment ✓

- [ ] **Install gcloud CLI** - [Install Guide](https://cloud.google.com/sdk/docs/install)
- [ ] **Set up GCP Account** with billing enabled
- [ ] **Have database credentials ready:**
  - Host: `34.55.195.199`
  - Port: `5432`
  - Database: `dbcp`
  - User: `yogass09`
  - Password: `jaimaakamakhya`

## Create .env.production File

In your project root, create `.env.production`:

```bash
POSTGRES_HOST=34.55.195.199
POSTGRES_PORT=5432
POSTGRES_DB=dbcp
POSTGRES_USER=yogass09
POSTGRES_PASSWORD=jaimaakamakhya
POSTGRES_POOL_SIZE=5
VITE_API_BASE_URL=https://forex-dashboard-xxxxx.run.app
VITE_ALPHA_VANTAGE_KEY=
NODE_ENV=production
```

**Note:** Replace `xxxxx` with your actual Cloud Run URL (you'll get this after first deployment)

## One-Line Deployment Command

```bash
# Set your GCP project ID
export PROJECT_ID="your-project-id"

# Create project (if needed)
gcloud projects create $PROJECT_ID --name="Forex Dashboard"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy!
gcloud run deploy forex-dashboard \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.production \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600
```

## After Deployment

1. **Get the service URL:**
   ```bash
   gcloud run services describe forex-dashboard --region us-central1
   ```

2. **Test health endpoint:**
   ```bash
   curl https://your-service-url/health
   ```

3. **Check logs if issues:**
   ```bash
   gcloud run logs read forex-dashboard --limit 50 --region us-central1
   ```

4. **Update .env.production with actual URL** and redeploy

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Database connection failed** | Verify credentials in .env.production and database is accessible |
| **App starts but shows blank page** | Check `/health` endpoint, verify static files are served |
| **404 on API calls** | Make sure `VITE_API_BASE_URL` points to same service URL |
| **Memory errors** | Increase `--memory` flag: `--memory 1Gi` |
| **Timeout during build** | Cloud Build takes time, check: `gcloud builds log --stream` |

## Files Created for Deployment

✓ `Dockerfile` - Multi-stage build for frontend + backend
✓ `.dockerignore` - Exclude unnecessary files from build
✓ `server/server.js` - Updated to serve React static files
✓ `vite.config.ts` - Changed base path from GitHub Pages to root
✓ `GCP-DEPLOYMENT.md` - Full deployment guide (read this!)

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run | $0-5 (2M free requests) |
| Cloud SQL | $15-40 (if used) |
| Network | $0-2 |
| **Total** | ~$15-50/month |

Much cheaper than Vercel! 🎉

## Next Steps (Optional)

- Set up auto-redeployment with Cloud Build
- Configure Cloud SQL for managed database
- Add custom domain mapping
- Set up monitoring and alerts

---

**Ready to deploy?** Follow the "One-Line Deployment Command" above!

For detailed guide, see `GCP-DEPLOYMENT.md`
