# Scraper Guide

## Quick Start

```bash
cd scrapers
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your credentials
```

## First-Time Run Order

**Important:** Run the database migration first (`supabase/migrations/001_initial_schema.sql`).

```bash
# 1. Historical seed data (static, no external API needed)
python historical_loader.py

# 2. ESPN bracket + teams (populates teams and games tables)
python espn_scraper.py

# 3. KenPom analytics (needs teams in DB)
python kenpom_scraper.py

# 4. Betting odds (needs games in DB)
python odds_fetcher.py

# 5. Travel distances (needs teams + games in DB)
python travel_calculator.py
```

## Environment Variables

| Variable | Where to Get |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `KENPOM_EMAIL` | Your KenPom subscription email |
| `KENPOM_PASSWORD` | Your KenPom password |
| `ODDS_API_KEY` | Register at the-odds-api.com (free tier) |

## GitHub Actions Secrets

Set these in your repo: Settings → Secrets and variables → Actions → New repository secret:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KENPOM_EMAIL`
- `KENPOM_PASSWORD`
- `ODDS_API_KEY`

## Automated Schedules

| Script | Workflow | Schedule |
|---|---|---|
| `espn_scraper.py` | `scrape_espn.yml` | Every 2 hours |
| `kenpom_scraper.py` | `scrape_kenpom.yml` | Daily 6AM ET (11AM UTC) |
| `odds_fetcher.py` | `scrape_odds.yml` | 3x daily (8AM, 2PM, 8PM ET) |
| `historical_loader.py` | `seed_historical.yml` | Manual dispatch only |

## API Rate Limits

### ESPN
- Unofficial API, no published limits
- 2-hour interval is respectful and sufficient
- If bracket data returns empty, the tournament bracket hasn't been announced yet

### KenPom
- Requires paid subscription ($24.99/year)
- Uses `kenpompy` library for authentication and data access
- Daily scrape is sufficient — data updates once per day
- Auth tokens may expire; re-login on each run

### The-Odds-API
- Free tier: 500 requests/month
- 3x daily = ~90 requests/month (well within limits)
- Check `x-requests-remaining` header in logs
- If you need more, paid plans start at $30/month

## Troubleshooting

### "No teams found in database"
Run `espn_scraper.py` first to populate the teams table.

### KenPom login fails
- Verify credentials in `.env`
- KenPom occasionally updates their site; check if `kenpompy` has a newer version
- Try: `pip install --upgrade kenpompy`

### Odds API returns empty
- Out of season or no current games
- Check API key is valid at the-odds-api.com dashboard
- NCAAB odds may not be available until games are scheduled

### Team name matching
- The scrapers use fuzzy matching for team names across APIs
- If a team consistently fails to match, check the logs and add a manual mapping
- Common issues: "UConn" vs "Connecticut", "St. John's" vs "Saint John's"
