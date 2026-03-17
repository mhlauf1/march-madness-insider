# Deployment Guide

## Vercel (Frontend)

### Setup

1. Push repo to GitHub
2. Import project at vercel.com/new
3. Set **Root Directory** to `.` (project root)
4. Set **Framework Preset** to Next.js
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Automatic Deploys

Every push to `main` triggers a production deployment.

### Custom Domain (Optional)

1. Go to project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Supabase (Database)

### Run Migration

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run"

### Verify Setup

- Check that all 9 tables exist in Table Editor
- Verify RLS policies are active (Authentication → Policies)
- Test with a simple query in SQL Editor: `SELECT count(*) FROM teams;`

## GitHub Actions (Scrapers)

### Set Secrets

Go to repo Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not anon key) |
| `KENPOM_EMAIL` | KenPom subscription email |
| `KENPOM_PASSWORD` | KenPom password |
| `ODDS_API_KEY` | The-Odds-API key |

### Manual Trigger

You can trigger any workflow manually:
1. Go to repo → Actions
2. Select the workflow
3. Click "Run workflow"

### Verify Workflows

After first run, check:
- Actions tab for success/failure
- Supabase Table Editor for populated data
- App pages for rendered content
