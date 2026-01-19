# GCP Cloud Run Infrastructure

> Complete documentation for all Cloud Run services, jobs, and schedulers powering the Forex Session Dashboard ecosystem.

**Last Updated**: 2026-01-19
**Project ID**: `social-data-pipeline-and-push`
**Region**: `us-central1`

---

## Migration Status

> **Current State (2026-01-19):** Both GitHub Actions and Cloud Run Jobs are running in parallel.
> All jobs use UPSERT, so no duplicates are created.
>
> **Plan:** After 1-2 days of monitoring, disable GitHub Actions scheduled workflows:
> ```bash
> gh workflow disable 'ForexFactory Realtime Update (2-3 Minutes)' --repo CryptoPrism-io/ForexFactory-Calendar-Scraper
> gh workflow disable 'ForexFactory Daily Sync (Month View)' --repo CryptoPrism-io/ForexFactory-Calendar-Scraper
> gh workflow disable 'CI/CD Pipeline' --repo CryptoPrism-io/DataPipeLine-FX-APP
> ```

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Cloud Run Services](#cloud-run-services)
3. [Cloud Run Jobs](#cloud-run-jobs)
4. [Cloud Scheduler](#cloud-scheduler)
5. [GitHub Actions Workflows](#github-actions-workflows)
6. [Secrets Management](#secrets-management)
7. [Monitoring & Logs](#monitoring--logs)
8. [Manual Operations](#manual-operations)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD PLATFORM                                │
│                    Project: social-data-pipeline-and-push                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐     ┌─────────────────────────────────────────┐   │
│  │   CLOUD SCHEDULER   │     │           CLOUD RUN SERVICES            │   │
│  ├─────────────────────┤     ├─────────────────────────────────────────┤   │
│  │                     │     │                                         │   │
│  │ forexfactory-       │────▶│  forex-dashboard                        │   │
│  │ scraper-scheduler   │     │  (Full-stack web app)                   │   │
│  │ (*/3 * * * *)       │     │  URL: forex-dashboard-963362833537.     │   │
│  │                     │     │       us-central1.run.app               │   │
│  │ fx-pipeline-hourly- │     │                                         │   │
│  │ scheduler           │     └─────────────────────────────────────────┘   │
│  │ (0 * * * *)         │                                                    │
│  │                     │     ┌─────────────────────────────────────────┐   │
│  │ fx-pipeline-daily-  │     │            CLOUD RUN JOBS               │   │
│  │ scheduler           │     ├─────────────────────────────────────────┤   │
│  │ (0 0 * * *)         │     │                                         │   │
│  │                     │────▶│  forexfactory-scraper                   │   │
│  └─────────────────────┘     │  (Economic calendar scraping)           │   │
│                              │                                         │   │
│                              │  fx-pipeline-hourly                     │   │
│                              │  (OHLC data + volatility metrics)       │   │
│                              │                                         │   │
│                              │  fx-pipeline-daily                      │   │
│                              │  (Correlation analysis)                 │   │
│                              │                                         │   │
│                              └──────────────┬──────────────────────────┘   │
│                                             │                               │
│                                             ▼                               │
│                              ┌─────────────────────────────────────────┐   │
│                              │         CLOUD SQL (PostgreSQL)          │   │
│                              │         Database: fx_global             │   │
│                              │         IP: 34.55.195.199               │   │
│                              └─────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              GITHUB REPOS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CryptoPrism-io/Forex-Session-Dashboard                                     │
│  └── Deploys: forex-dashboard (Cloud Run Service)                           │
│                                                                              │
│  CryptoPrism-io/ForexFactory-Calendar-Scraper                               │
│  └── Deploys: forexfactory-scraper (Cloud Run Job)                          │
│                                                                              │
│  CryptoPrism-io/DataPipeLine-FX-APP                                         │
│  └── Deploys: fx-pipeline-hourly, fx-pipeline-daily (Cloud Run Jobs)        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cloud Run Services

### forex-dashboard

**Type**: Cloud Run Service (always-on web application)
**URL**: https://forex-dashboard-963362833537.us-central1.run.app

| Property | Value |
|----------|-------|
| Memory | 512 Mi |
| CPU | 1 |
| Min Instances | 0 |
| Max Instances | 10 |
| Timeout | 300s |
| Authentication | Allow unauthenticated |

**Deploys From**: `CryptoPrism-io/Forex-Session-Dashboard`
**Workflow**: `.github/workflows/deploy.yml`
**Trigger**: Push to `main` branch

**What It Serves**:
- React frontend (static files from `/dist`)
- Express.js API (`/api/calendar/*`, `/api/fx/*`)
- Connects to Cloud SQL PostgreSQL

---

## Cloud Run Jobs

### forexfactory-scraper

**Type**: Cloud Run Job (scheduled batch job)
**Purpose**: Scrapes ForexFactory economic calendar

| Property | Value |
|----------|-------|
| Memory | 1 Gi |
| CPU | 1 |
| Task Timeout | 300s |
| Max Retries | 1 |
| Schedule | Every 3 minutes (`*/3 * * * *`) |

**Deploys From**: `CryptoPrism-io/ForexFactory-Calendar-Scraper`
**Workflow**: `scraper/.github/workflows/deploy-cloud-run-job.yml`
**Docker Image**: `us-central1-docker.pkg.dev/social-data-pipeline-and-push/forex-scraper/forexfactory-scraper`

**Environment Variables**:
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `OUTPUT_MODE=db`
- `SCRAPER_VERBOSE=false`

**What It Does**:
1. Launches headless Chrome with Xvfb
2. Scrapes ForexFactory calendar page
3. Parses economic events (date, time, currency, impact, actual/forecast/previous)
4. Upserts to `economic_calendar_ff` table
5. Logs sync operation to `sync_log` table

---

### fx-pipeline-hourly

**Type**: Cloud Run Job (scheduled batch job)
**Purpose**: Fetches OANDA price data and calculates volatility metrics

| Property | Value |
|----------|-------|
| Memory | 1 Gi |
| CPU | 1 |
| Task Timeout | 600s |
| Max Retries | 2 |
| Schedule | Every hour at :00 (`0 * * * *`) |

**Deploys From**: `CryptoPrism-io/DataPipeLine-FX-APP`
**Workflow**: `fx-pipeline/.github/workflows/deploy-cloud-run-jobs.yml`
**Docker Image**: `us-central1-docker.pkg.dev/social-data-pipeline-and-push/fx-pipeline/fx-pipeline-jobs`

**Environment Variables**:
- `JOB_TYPE=hourly`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `OANDA_API_KEY`, `OANDA_ENVIRONMENT`

**What It Does**:
1. Fetches latest OHLC candles from OANDA v20 API for 20 currency pairs
2. Calculates volatility metrics (HV-20, ATR, SMA-30, Bollinger Bands)
3. Stores in `oanda_candles` and `volatility_metrics` tables
4. Logs job execution to `cron_job_log` table

---

### fx-pipeline-daily

**Type**: Cloud Run Job (scheduled batch job)
**Purpose**: Calculates correlation matrix between currency pairs

| Property | Value |
|----------|-------|
| Memory | 2 Gi |
| CPU | 2 |
| Task Timeout | 1800s (30 min) |
| Max Retries | 2 |
| Schedule | Daily at midnight UTC (`0 0 * * *`) |

**Deploys From**: `CryptoPrism-io/DataPipeLine-FX-APP`
**Workflow**: `fx-pipeline/.github/workflows/deploy-cloud-run-jobs.yml`
**Docker Image**: `us-central1-docker.pkg.dev/social-data-pipeline-and-push/fx-pipeline/fx-pipeline-jobs`

**Environment Variables**:
- `JOB_TYPE=daily`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `OANDA_API_KEY`, `OANDA_ENVIRONMENT`
- `CORRELATION_WINDOW_SIZE=100`
- `CORRELATION_THRESHOLD=0.7`

**What It Does**:
1. Fetches last 100 hours of OHLC data for all pairs
2. Calculates pairwise Pearson correlation coefficients
3. Identifies best trading pairs (uncorrelated/negatively correlated)
4. Stores in `correlation_matrix` and `best_pairs_tracker` tables

---

## Cloud Scheduler

| Scheduler Name | Schedule | Target Job | Time Zone |
|----------------|----------|------------|-----------|
| `forexfactory-scraper-scheduler` | `*/3 * * * *` (every 3 min) | forexfactory-scraper | UTC |
| `fx-pipeline-hourly-scheduler` | `0 * * * *` (hourly at :00) | fx-pipeline-hourly | UTC |
| `fx-pipeline-daily-scheduler` | `0 0 * * *` (daily at 00:00) | fx-pipeline-daily | UTC |

**Authentication**: OAuth with service account `github-actions@social-data-pipeline-and-push.iam.gserviceaccount.com`

---

## GitHub Actions Workflows

### Main Dashboard Deployment

**File**: `Forex-Session-Dashboard/.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**Steps**:
1. Checkout code
2. Authenticate via Workload Identity Federation
3. Build React frontend with `VITE_API_BASE_URL`
4. Deploy to Cloud Run with `gcloud run deploy`

---

### Scraper Deployment

**File**: `scraper/.github/workflows/deploy-cloud-run-job.yml`

```yaml
on:
  push:
    branches: [main]
    paths: ['scraper_2.2/**', 'Dockerfile', '.github/workflows/deploy-cloud-run-job.yml']
  workflow_dispatch:
```

**Steps**:
1. Checkout code
2. Authenticate via Workload Identity Federation
3. Create Artifact Registry repository (if not exists)
4. Build and push Docker image
5. Create/update Cloud Run Job
6. Create/update Cloud Scheduler

---

### FX Pipeline Deployment

**File**: `fx-pipeline/.github/workflows/deploy-cloud-run-jobs.yml`

```yaml
on:
  push:
    branches: [main]
    paths: ['jobs/**', 'utils/**', 'oanda_integration.py', 'requirements.txt', 'Dockerfile.cloudrun']
  workflow_dispatch:
```

**Steps**:
1. Build and push Docker image (shared by both jobs)
2. Deploy hourly job + scheduler (parallel)
3. Deploy daily job + scheduler (parallel)
4. Verify deployment

---

## Secrets Management

### GitHub Secrets Required Per Repo

| Secret | Dashboard | Scraper | FX Pipeline | Description |
|--------|-----------|---------|-------------|-------------|
| `WIF_PROVIDER` | ✅ | ✅ | ✅ | Workload Identity Pool Provider |
| `WIF_SERVICE_ACCOUNT` | ✅ | ✅ | ✅ | GCP Service Account email |
| `POSTGRES_HOST` | ✅ | ✅ | ✅ | `34.55.195.199` |
| `POSTGRES_PORT` | ✅ | ✅ | ✅ | `5432` |
| `POSTGRES_DB` | ✅ | ✅ | ✅ | `fx_global` |
| `POSTGRES_USER` | ✅ | ✅ | ✅ | Database user |
| `POSTGRES_PASSWORD` | ✅ | ✅ | ✅ | Database password |
| `OANDA_API_KEY` | ❌ | ❌ | ✅ | OANDA v20 API key |
| `OANDA_ENVIRONMENT` | ❌ | ❌ | ✅ | `practice` or `live` |

### Workload Identity Federation

**Pool**: `projects/963362833537/locations/global/workloadIdentityPools/github`
**Provider**: `projects/963362833537/locations/global/workloadIdentityPools/github/providers/github`
**Service Account**: `github-actions@social-data-pipeline-and-push.iam.gserviceaccount.com`

This setup allows GitHub Actions to authenticate to GCP without storing service account keys.

---

## Monitoring & Logs

### View Logs

```bash
# Cloud Run Service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=forex-dashboard" \
  --project=social-data-pipeline-and-push --limit=50

# Cloud Run Job logs (scraper)
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=forexfactory-scraper" \
  --project=social-data-pipeline-and-push --limit=50

# Cloud Run Job logs (fx-pipeline hourly)
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=fx-pipeline-hourly" \
  --project=social-data-pipeline-and-push --limit=50

# Cloud Run Job logs (fx-pipeline daily)
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=fx-pipeline-daily" \
  --project=social-data-pipeline-and-push --limit=50
```

### View Job Executions

```bash
# List recent executions
gcloud run jobs executions list --job=forexfactory-scraper \
  --region=us-central1 --project=social-data-pipeline-and-push --limit=10

gcloud run jobs executions list --job=fx-pipeline-hourly \
  --region=us-central1 --project=social-data-pipeline-and-push --limit=10

gcloud run jobs executions list --job=fx-pipeline-daily \
  --region=us-central1 --project=social-data-pipeline-and-push --limit=10
```

### Cloud Console Links

- **Cloud Run Services**: https://console.cloud.google.com/run?project=social-data-pipeline-and-push
- **Cloud Run Jobs**: https://console.cloud.google.com/run/jobs?project=social-data-pipeline-and-push
- **Cloud Scheduler**: https://console.cloud.google.com/cloudscheduler?project=social-data-pipeline-and-push
- **Logs Explorer**: https://console.cloud.google.com/logs?project=social-data-pipeline-and-push

---

## Manual Operations

### Trigger Jobs Manually

```bash
# Run scraper job now
gcloud run jobs execute forexfactory-scraper \
  --region=us-central1 --project=social-data-pipeline-and-push

# Run hourly job now
gcloud run jobs execute fx-pipeline-hourly \
  --region=us-central1 --project=social-data-pipeline-and-push

# Run daily job now
gcloud run jobs execute fx-pipeline-daily \
  --region=us-central1 --project=social-data-pipeline-and-push
```

### Pause/Resume Schedulers

```bash
# Pause a scheduler
gcloud scheduler jobs pause forexfactory-scraper-scheduler \
  --location=us-central1 --project=social-data-pipeline-and-push

# Resume a scheduler
gcloud scheduler jobs resume forexfactory-scraper-scheduler \
  --location=us-central1 --project=social-data-pipeline-and-push
```

### Update Job Configuration

```bash
# Update memory/CPU
gcloud run jobs update fx-pipeline-daily \
  --region=us-central1 --project=social-data-pipeline-and-push \
  --memory=4Gi --cpu=4

# Update timeout
gcloud run jobs update forexfactory-scraper \
  --region=us-central1 --project=social-data-pipeline-and-push \
  --task-timeout=600s
```

### Update Scheduler Frequency

```bash
# Change scraper to run every 5 minutes
gcloud scheduler jobs update http forexfactory-scraper-scheduler \
  --location=us-central1 --project=social-data-pipeline-and-push \
  --schedule="*/5 * * * *"
```

---

## Troubleshooting

### Job Failed - Check Logs

```bash
# Get latest execution ID
EXEC_ID=$(gcloud run jobs executions list --job=forexfactory-scraper \
  --region=us-central1 --project=social-data-pipeline-and-push \
  --limit=1 --format="value(name)")

# View execution logs
gcloud logging read "resource.labels.execution_name=$EXEC_ID" \
  --project=social-data-pipeline-and-push --limit=100
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Job timeout | Processing took too long | Increase `--task-timeout` |
| Memory exceeded | Large data processing | Increase `--memory` |
| Database connection failed | Wrong credentials or network | Check secrets, verify Cloud SQL IP |
| Scheduler not triggering | Paused or wrong schedule | Check scheduler state, verify cron syntax |
| Authentication failed | WIF misconfigured | Verify WIF_PROVIDER and WIF_SERVICE_ACCOUNT |

### Verify Database Connectivity

```bash
# Test from Cloud Shell
gcloud sql connect fx-global --user=yogass09 --project=social-data-pipeline-and-push
```

### Check Service Account Permissions

```bash
# List roles for the service account
gcloud projects get-iam-policy social-data-pipeline-and-push \
  --filter="bindings.members:github-actions@social-data-pipeline-and-push.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

Required roles:
- `roles/run.admin` - Deploy Cloud Run services/jobs
- `roles/artifactregistry.writer` - Push Docker images
- `roles/cloudscheduler.admin` - Create/update schedulers
- `roles/iam.serviceAccountUser` - Use service account

---

## Cost Optimization

### Cloud Run Jobs (Pay-per-use)

Jobs only incur costs when running:
- **Scraper**: ~5 sec/run × 480 runs/day = ~40 min/day
- **Hourly**: ~2 min/run × 24 runs/day = ~48 min/day
- **Daily**: ~10 min/run × 1 run/day = ~10 min/day

**Estimated Monthly Cost**: ~$5-10 for compute

### Cloud Scheduler

- First 3 jobs free
- Additional jobs: $0.10/job/month

**Current Cost**: $0 (3 jobs within free tier)

---

## Quick Reference

### URLs

| Resource | URL |
|----------|-----|
| Dashboard | https://forex-dashboard-963362833537.us-central1.run.app |
| GitHub (Dashboard) | https://github.com/CryptoPrism-io/Forex-Session-Dashboard |
| GitHub (Scraper) | https://github.com/CryptoPrism-io/ForexFactory-Calendar-Scraper |
| GitHub (FX Pipeline) | https://github.com/CryptoPrism-io/DataPipeLine-FX-APP |

### Key Commands

```bash
# List all resources
gcloud run services list --project=social-data-pipeline-and-push --region=us-central1
gcloud run jobs list --project=social-data-pipeline-and-push --region=us-central1
gcloud scheduler jobs list --project=social-data-pipeline-and-push --location=us-central1

# Check job status
gcloud run jobs describe forexfactory-scraper --region=us-central1 --project=social-data-pipeline-and-push
gcloud run jobs describe fx-pipeline-hourly --region=us-central1 --project=social-data-pipeline-and-push
gcloud run jobs describe fx-pipeline-daily --region=us-central1 --project=social-data-pipeline-and-push
```
