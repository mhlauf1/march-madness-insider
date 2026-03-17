# BurgerLab

The definitive guide for March Madness 2026 — bracket filling, team analysis, betting intelligence, and tournament tracking.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Database:** Supabase (Postgres)
- **Data:** Python scrapers (ESPN, KenPom, The-Odds-API)
- **Deployment:** Vercel + GitHub Actions

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase credentials

# Run development server
pnpm dev
```

## Data Setup

```bash
# Run database migration first (paste into Supabase SQL Editor)
# Then populate data:
cd scrapers
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in credentials

python historical_loader.py   # Static seed data
python espn_scraper.py         # Teams + bracket
python kenpom_scraper.py       # Analytics
python odds_fetcher.py         # Betting lines
python travel_calculator.py    # Travel distances
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — tournament overview, upcoming games, odds |
| `/bracket` | Full 68-team interactive bracket |
| `/teams` | All teams with filtering and sorting |
| `/teams/[slug]` | Team deep dive — stats, players, history |
| `/matchups/[gameId]` | Head-to-head game analysis |
| `/compare` | Side-by-side team comparison |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Scraper Guide](docs/SCRAPER_GUIDE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Full Spec](docs/SPEC.md)
