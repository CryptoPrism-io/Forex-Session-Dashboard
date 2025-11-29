# GCP Cloud Run Deployment Guide

This guide walks you through deploying the Forex Session Dashboard to Google Cloud Platform (GCP) Cloud Run.

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed ([install here](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed locally (optional, GCP can build for you)
4. Your **PostgreSQL database credentials** ready

## Step 1: Set Up GCP Project

```bash
# Set your GCP project ID
export PROJECT_ID="your-project-id"

# Create a new GCP project (if needed)
gcloud projects create $PROJECT_ID --name="Forex Dashboard"

# Set the active project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 2: Configure Environment Variables in GCP

Go to **Google Cloud Console → Cloud Run → Create Service → Advanced Settings** (after deployment), or set them via gcloud:

```bash
# Create a .env.production file with your variables
cat > .env.production << EOF
POSTGRES_HOST=your-database-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database-name
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-database-password
POSTGRES_POOL_SIZE=5
VITE_API_BASE_URL=https://your-cloud-run-url
VITE_ALPHA_VANTAGE_KEY=your-api-key
NODE_ENV=production
EOF
```

**Note:** Replace all values with your actual credentials.

## Step 3: Deploy to Cloud Run

### Option A: Deploy with gcloud CLI (Easiest)

```bash
# From the project root directory
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

**What this does:**
- `--source .` - Builds from current directory using Dockerfile
- `--region us-central1` - Deploy to US region (change if needed)
- `--allow-unauthenticated` - Makes your app public (required for web access)
- `--env-vars-file` - Loads environment variables from file
- `--memory 512Mi` - Allocates 512MB RAM (sufficient for this app)
- `--cpu 1` - Allocates 1 CPU

### Option B: Deploy with Docker (More Control)

```bash
# Build Docker image locally
docker build -t gcr.io/$PROJECT_ID/forex-dashboard .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/forex-dashboard

# Deploy the image
gcloud run deploy forex-dashboard \
  --image gcr.io/$PROJECT_ID/forex-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.production \
  --memory 512Mi \
  --cpu 1
```

## Step 4: Verify Deployment

After deployment, you'll get a URL like: `https://forex-dashboard-xxxxx.run.app`

Test it:

```bash
# Health check
curl https://your-cloud-run-url/health

# You should see:
# {"status":"healthy","timestamp":"2025-01-10T...","database":"connected"}
```

If health check fails, check logs:

```bash
gcloud run logs read forex-dashboard --limit 50 --region us-central1
```

## Step 5: Update Environment Variables (If Needed)

After initial deployment, you can update variables:

```bash
gcloud run services update forex-dashboard \
  --region us-central1 \
  --env-vars-from-file .env.production
```

Or through the Cloud Console:
1. Go to **Cloud Run → forex-dashboard**
2. Click **Edit & Deploy New Revision**
3. Scroll to **Runtime Settings**
4. Add/edit environment variables
5. Click **Deploy**

## Step 6: Custom Domain (Optional)

Map your own domain to the Cloud Run service:

1. Go to **Cloud Run → forex-dashboard**
2. Click **Manage Custom Domains**
3. Add your domain and follow DNS verification steps

## Troubleshooting

### Database Connection Issues

```bash
# Check logs for connection errors
gcloud run logs read forex-dashboard --limit 100

# Common causes:
# - Database credentials wrong in env vars
# - Firewall blocking access to database
# - Database host unreachable from GCP
```

**Solution:** Verify database is accessible:
```bash
# From your local machine
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT NOW();"
```

### App Not Starting

Check the build logs:
```bash
gcloud builds log --stream
```

### High Memory Usage

If your service is restarting due to memory limits, increase it:
```bash
gcloud run services update forex-dashboard \
  --region us-central1 \
  --memory 1Gi
```

## Cost Monitoring

Monitor your Cloud Run costs:

```bash
# Set up billing alerts
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Forex Dashboard Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=100
```

**Estimated Monthly Cost:**
- Cloud Run: $0-5 (2M free requests/month)
- Cloud SQL: $15-40 (if using Cloud SQL)
- Network: $0-2
- **Total: ~$15-50/month**

## Redeploying After Changes

```bash
# Make your code changes, then:
gcloud run deploy forex-dashboard \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.production
```

## Useful Commands

```bash
# View service details
gcloud run services describe forex-dashboard --region us-central1

# List all deployments
gcloud run services list

# Delete the service
gcloud run services delete forex-dashboard --region us-central1

# Follow logs in real-time
gcloud run logs read forex-dashboard --region us-central1 --follow

# Scale limits
gcloud run services update forex-dashboard \
  --region us-central1 \
  --max-instances 100 \
  --min-instances 1
```

## Next Steps

1. **Set up monitoring**: Use Cloud Logging and Cloud Monitoring
2. **Enable authentication**: If you want to restrict access
3. **Set up CI/CD**: Use Cloud Build for automatic deployments on git push
4. **Use Cloud SQL**: For managed PostgreSQL instead of external database

## Support

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Troubleshooting Cloud Run](https://cloud.google.com/run/docs/troubleshooting)
