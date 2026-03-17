# BurgerLab Scrapers

Python data collection scripts for the BurgerLab tournament database.

## Setup

```bash
cd scrapers
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Scrapers read from the root `.env.local` file (shared with Next.js). Make sure it contains:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings (service role, not anon) |
| `KENPOM_EMAIL` | Your KenPom subscription email |
| `KENPOM_PASSWORD` | Your KenPom password |
| `ODDS_API_KEY` | Free key from the-odds-api.com |

## Run Order (First Time)

Run these in order after deploying the database schema:

```bash
# 1. Load historical seed performance data
python historical_loader.py

# 2. Scrape bracket structure + teams from ESPN
python espn_scraper.py

# 3. Pull KenPom analytics (requires teams in DB first)
python kenpom_scraper.py

# 4. Fetch betting odds (requires games in DB first)
python odds_fetcher.py

# 5. Calculate travel distances (requires teams + games)
python travel_calculator.py
```

## Automated Schedule (GitHub Actions)

| Scraper | Schedule | Workflow |
|---|---|---|
| `espn_scraper.py` | Every 2 hours | `scrape_espn.yml` |
| `kenpom_scraper.py` | Daily 6AM ET | `scrape_kenpom.yml` |
| `odds_fetcher.py` | 3x daily (8AM, 2PM, 8PM ET) | `scrape_odds.yml` |

## API Limits

- **ESPN API**: Unofficial, no published rate limits. Be respectful — the 2-hour interval is sufficient.
- **KenPom**: Subscription required. Daily scrape is plenty — data updates once per day.
- **The-Odds-API**: Free tier = 500 requests/month. At 3x/day = ~90 requests/month (well within limits).

## Troubleshooting

- **ESPN returns empty data**: Tournament may not have started yet, or bracket not announced.
- **KenPom login fails**: Check credentials. KenPom occasionally changes their auth flow.
- **Odds API returns no NCAAB data**: Out of season or no active tournament games.
- **Team name matching fails**: Check logs for unmatched teams and update the name normalization logic.
