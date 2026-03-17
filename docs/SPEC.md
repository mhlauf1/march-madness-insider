# March Madness 2026 — Complete Build Specification

## Project Overview

A public-facing, production-grade March Madness web application for the 2026 NCAA Men's Basketball Tournament. The app serves as the definitive guide for bracket filling, team analysis, betting intelligence, and tournament tracking. Anyone with the link can use it. Designed to be shared among friends and used throughout the entire tournament (March 17 – April 6, 2026).

**Project name:** `burgerlab` (use this as the repo name and app identity)
**URL:** Deploy to Vercel, custom domain optional

---

## Tech Stack

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Frontend         | Next.js 15 (App Router)                            |
| Language         | TypeScript throughout                              |
| Styling          | Tailwind CSS v4 + CSS variables                    |
| Database         | Supabase (Postgres)                                |
| DB Client        | `@supabase/supabase-js` v2                         |
| Data Scrapers    | Python 3.11                                        |
| Scraper Schedule | GitHub Actions (cron)                              |
| Deployment       | Vercel (frontend)                                  |
| Package Manager  | pnpm                                               |
| Fonts            | Geist Sans + Geist Mono (from `geist` npm package) |
| Icons            | `lucide-react`                                     |
| Charts           | `recharts`                                         |
| Animations       | `framer-motion`                                    |
| Date handling    | `date-fns`                                         |

---

## Repository Structure

```
burgerlab/
├── apps/
│   └── web/                        # Next.js app
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx             # Home / Dashboard
│       │   ├── bracket/
│       │   │   └── page.tsx         # Full interactive bracket
│       │   ├── teams/
│       │   │   ├── page.tsx         # All teams grid
│       │   │   └── [slug]/
│       │   │       └── page.tsx     # Individual team deep dive
│       │   ├── matchups/
│       │   │   └── [gameId]/
│       │   │       └── page.tsx     # Head-to-head matchup analysis
│       │   ├── betting/
│       │   │   └── page.tsx         # Betting dashboard
│       │   ├── upsets/
│       │   │   └── page.tsx         # Historical upset + seed data
│       │   └── compare/
│       │       └── page.tsx         # Team comparison tool
│       ├── components/
│       │   ├── ui/                  # Base UI primitives
│       │   ├── bracket/             # Bracket-specific components
│       │   ├── teams/               # Team-specific components
│       │   ├── betting/             # Betting components
│       │   └── shared/              # Shared layout components
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts        # Browser client
│       │   │   └── server.ts        # Server client
│       │   ├── queries/             # All Supabase query functions
│       │   ├── utils/               # Helpers, formatters
│       │   └── types/               # All TypeScript types
│       ├── public/
│       └── package.json
├── scrapers/
│   ├── espn_scraper.py
│   ├── kenpom_scraper.py
│   ├── odds_fetcher.py
│   ├── historical_loader.py
│   ├── travel_calculator.py
│   ├── requirements.txt
│   └── README.md
├── .github/
│   └── workflows/
│       ├── scrape_espn.yml
│       ├── scrape_kenpom.yml
│       ├── scrape_odds.yml
│       └── seed_historical.yml
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── README.md
```

---

## Environment Variables

### Next.js app (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### GitHub Actions Secrets (set in repo settings)

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
KENPOM_EMAIL
KENPOM_PASSWORD
ODDS_API_KEY        # from the-odds-api.com, free tier
```

---

## Supabase Database Schema

### Table: `teams`

Stores all 68 tournament teams with static and seeding data.

```sql
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espn_id         TEXT UNIQUE NOT NULL,           -- ESPN team ID for API calls
  name            TEXT NOT NULL,                   -- e.g. "Duke"
  full_name       TEXT NOT NULL,                   -- e.g. "Duke Blue Devils"
  slug            TEXT UNIQUE NOT NULL,            -- e.g. "duke-blue-devils"
  abbreviation    TEXT NOT NULL,                   -- e.g. "DUKE"
  conference      TEXT NOT NULL,                   -- e.g. "ACC"
  seed            INTEGER NOT NULL,                -- 1-16
  region          TEXT NOT NULL,                   -- "East" | "West" | "Midwest" | "South"
  coach           TEXT,
  record_wins     INTEGER,
  record_losses   INTEGER,
  logo_url        TEXT,                            -- ESPN logo CDN URL
  primary_color   TEXT,                            -- hex, e.g. "#003087"
  secondary_color TEXT,                            -- hex
  campus_city     TEXT,                            -- e.g. "Durham"
  campus_state    TEXT,                            -- e.g. "NC"
  campus_lat      DECIMAL(9,6),
  campus_lng      DECIMAL(9,6),
  ncaa_titles     INTEGER DEFAULT 0,
  tournament_appearances INTEGER DEFAULT 0,
  last_title_year INTEGER,
  is_first_four   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `kenpom_ratings`

One row per team with all KenPom metrics. Updated daily.

```sql
CREATE TABLE kenpom_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL DEFAULT 2026,
  kenpom_rank     INTEGER,
  adj_em          DECIMAL(6,2),    -- Adjusted Efficiency Margin (overall power)
  adj_o           DECIMAL(6,2),    -- Adjusted Offensive Efficiency
  adj_o_rank      INTEGER,
  adj_d           DECIMAL(6,2),    -- Adjusted Defensive Efficiency (lower = better)
  adj_d_rank      INTEGER,
  adj_t           DECIMAL(5,2),    -- Adjusted Tempo (possessions per 40 min)
  adj_t_rank      INTEGER,
  luck            DECIMAL(5,3),    -- Luck rating
  luck_rank       INTEGER,
  sos_adj_em      DECIMAL(6,2),    -- Strength of Schedule
  sos_adj_em_rank INTEGER,
  sos_opp_o       DECIMAL(6,2),    -- Opponent adjusted offense
  sos_opp_d       DECIMAL(6,2),    -- Opponent adjusted defense
  ncsos_adj_em    DECIMAL(6,2),    -- Non-conference SOS
  ncsos_rank      INTEGER,
  -- Four Factors (Offense)
  off_efg_pct     DECIMAL(5,3),    -- Effective FG%
  off_to_pct      DECIMAL(5,3),    -- Turnover %
  off_or_pct      DECIMAL(5,3),    -- Offensive Rebound %
  off_ftr         DECIMAL(5,3),    -- Free Throw Rate
  -- Four Factors (Defense)
  def_efg_pct     DECIMAL(5,3),
  def_to_pct      DECIMAL(5,3),
  def_or_pct      DECIMAL(5,3),
  def_ftr         DECIMAL(5,3),
  -- Points distribution
  pct_2pt         DECIMAL(5,3),    -- % of points from 2pt
  pct_3pt         DECIMAL(5,3),    -- % of points from 3pt
  pct_ft          DECIMAL(5,3),    -- % of points from FT
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, season)
);
```

### Table: `kenpom_players`

Top player stats per team from KenPom.

```sql
CREATE TABLE kenpom_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL DEFAULT 2026,
  name            TEXT NOT NULL,
  position        TEXT,
  height          TEXT,
  year_class      TEXT,             -- "Fr", "So", "Jr", "Sr"
  minutes_pct     DECIMAL(5,1),     -- % of team minutes played
  ppg             DECIMAL(5,1),
  rpg             DECIMAL(4,1),
  apg             DECIMAL(4,1),
  off_rtg         DECIMAL(6,1),     -- Offensive rating
  usg_pct         DECIMAL(5,1),     -- Usage %
  efg_pct         DECIMAL(5,3),
  ts_pct          DECIMAL(5,3),     -- True Shooting %
  scraped_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `kenpom_program_history`

Historical KenPom ratings by year for each program (great for program trajectory charts).

```sql
CREATE TABLE kenpom_program_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL,
  kenpom_rank     INTEGER,
  adj_em          DECIMAL(6,2),
  adj_o           DECIMAL(6,2),
  adj_d           DECIMAL(6,2),
  record          TEXT,             -- e.g. "32-2"
  tournament_seed INTEGER,
  tournament_result TEXT,           -- "Champion", "Runner-up", "Final Four", "Elite Eight", "Sweet 16", "Round of 32", "Round of 64", "DNQ"
  UNIQUE (team_id, season)
);
```

### Table: `games`

All 67 tournament games. Populated at bracket announcement, updated as results come in.

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espn_game_id    TEXT UNIQUE,
  round           INTEGER NOT NULL,     -- 0=First Four, 1=R64, 2=R32, 3=Sweet16, 4=Elite8, 5=Final4, 6=Championship
  round_name      TEXT NOT NULL,        -- "First Four" | "Round of 64" | etc.
  region          TEXT,                 -- NULL for Final Four/Championship
  game_number     INTEGER,              -- position in bracket
  scheduled_at    TIMESTAMPTZ,
  venue_name      TEXT,
  venue_city      TEXT,
  venue_state     TEXT,
  venue_lat       DECIMAL(9,6),
  venue_lng       DECIMAL(9,6),
  team1_id        UUID REFERENCES teams(id),
  team2_id        UUID REFERENCES teams(id),
  team1_score     INTEGER,
  team2_score     INTEGER,
  winner_id       UUID REFERENCES teams(id),
  is_completed    BOOLEAN DEFAULT FALSE,
  is_upset        BOOLEAN DEFAULT FALSE,   -- true if lower seed won
  kenpom_fanmatch DECIMAL(5,2),            -- KenPom game excitement rating
  status          TEXT DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'final'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `betting_odds`

Per-game betting lines, updated 3x daily.

```sql
CREATE TABLE betting_odds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,
  bookmaker       TEXT NOT NULL,        -- "draftkings" | "fanduel" | "betmgm" | "caesars"
  spread_team1    DECIMAL(5,2),         -- negative = team1 favored
  spread_team2    DECIMAL(5,2),
  ml_team1        INTEGER,              -- moneyline (American odds)
  ml_team2        INTEGER,
  total_over      DECIMAL(5,2),
  total_under     DECIMAL(5,2),
  over_odds       INTEGER,
  under_odds      INTEGER,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `championship_futures`

Championship odds per team per book, timestamped for movement tracking.

```sql
CREATE TABLE championship_futures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  bookmaker       TEXT NOT NULL,
  odds            INTEGER NOT NULL,     -- American odds e.g. +330
  implied_prob    DECIMAL(5,4),         -- calculated: 100 / (odds + 100) for +odds
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `historical_seed_data`

Static table. Win rates by seed and round since 1985. Loaded once.

```sql
CREATE TABLE historical_seed_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed            INTEGER NOT NULL,     -- 1-16
  round           INTEGER NOT NULL,     -- 1=R64, 2=R32, 3=S16, 4=E8, 5=F4, 6=Champ
  round_name      TEXT NOT NULL,
  games_played    INTEGER NOT NULL,
  wins            INTEGER NOT NULL,
  win_rate        DECIMAL(5,4) NOT NULL,
  avg_margin_win  DECIMAL(5,2),
  avg_margin_loss DECIMAL(5,2),
  UNIQUE (seed, round)
);
```

### Table: `team_travel`

Pre-calculated travel distances for each team to their assigned venue. Loaded once when bracket is set.

```sql
CREATE TABLE team_travel (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,
  distance_miles  INTEGER,
  timezone_changes INTEGER,            -- number of tz jumps from campus
  flight_required BOOLEAN,
  is_home_state   BOOLEAN,             -- venue in same state as campus
  travel_notes    TEXT                 -- e.g. "2,100 miles west"
);
```

### Indexes

```sql
CREATE INDEX idx_games_round ON games(round);
CREATE INDEX idx_games_region ON games(region);
CREATE INDEX idx_games_team1 ON games(team1_id);
CREATE INDEX idx_games_team2 ON games(team2_id);
CREATE INDEX idx_betting_odds_game ON betting_odds(game_id);
CREATE INDEX idx_futures_team ON championship_futures(team_id);
CREATE INDEX idx_futures_fetched ON championship_futures(fetched_at DESC);
CREATE INDEX idx_kenpom_team ON kenpom_ratings(team_id);
CREATE INDEX idx_history_team ON kenpom_program_history(team_id, season);
```

### Row Level Security

Enable RLS on all tables. All tables are public read (SELECT), no public write.

```sql
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- repeat for all tables

CREATE POLICY "Public read" ON teams FOR SELECT USING (true);
-- repeat for all tables
```

---

## Python Scrapers

Install all dependencies via `scrapers/requirements.txt`:

```
supabase==2.3.0
kenpompy==0.3.5
requests==2.31.0
beautifulsoup4==4.12.2
pandas==2.1.4
python-dotenv==1.0.0
geopy==2.4.1
```

Each scraper reads env vars from a `.env` file in the scrapers directory:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KENPOM_EMAIL=
KENPOM_PASSWORD=
ODDS_API_KEY=
```

---

### `scrapers/espn_scraper.py`

**Purpose:** Pulls bracket structure and updates game results.
**Schedule:** Every 2 hours during tournament weeks (March 17 – April 6).

**What it does:**

1. Fetches the NCAA tournament bracket from ESPN's hidden API endpoint:
   `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&limit=100`
   and
   `https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/tournament/bracket`
2. Parses all 67 games: round, region, teams, scheduled time, venue, scores
3. For each team found, fetches team data including ESPN team ID, colors, logo:
   `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{espnId}`
4. Upserts team records into `teams` table
5. Upserts game records into `games` table
6. Marks games as completed when scores are final, sets `winner_id`, sets `is_upset` to true when lower seed beats higher seed
7. For completed games, updates the next-round game in the bracket with the winner as a participant

**Key logic:**

- Use `espn_game_id` as the upsert key for games
- ESPN logo URL pattern: `https://a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png`
- Round mapping: First Four = 0, R64 = 1, R32 = 2, Sweet 16 = 3, Elite 8 = 4, Final Four = 5, Championship = 6
- An upset is defined as: lower seed number beats higher seed number (e.g. seed 12 beats seed 5)

---

### `scrapers/kenpom_scraper.py`

**Purpose:** Pulls all KenPom analytics data for the 68 tournament teams.
**Schedule:** Once daily at 6:00 AM ET.

**What it does:**

1. Authenticates using `kenpompy.utils.login(email, password)`
2. Fetches main ratings table: `kenpompy.misc.get_pomeroy_ratings(browser)` — returns the main index DataFrame with AdjEM, AdjO, AdjD, AdjT, Luck, SOS columns
3. Fetches team stats: `kenpompy.summary.get_teamstats(browser)` for offense AND `kenpompy.summary.get_teamstats(browser, defense=True)` for defense — gives Four Factors
4. Fetches points distribution: `kenpompy.summary.get_pointdist(browser)` — 2pt/3pt/FT breakdown
5. Fetches player leaders for each tournament team: `kenpompy.summary.get_playerstats(browser, metric='ORtg')` — loop through relevant metrics
6. For each tournament team, fetches program history: `kenpompy.team.get_schedule(browser, team=team_name)` going back 10 seasons
7. Fetches program ratings: `kenpompy.misc.get_program_ratings(browser)` — historical program strength

**Matching logic:**

- KenPom team names don't always match ESPN team names exactly
- Build a manual mapping dictionary for the 68 tournament teams
- Match by normalized name (lowercase, remove special chars)
- Fall back to fuzzy matching using `difflib.get_close_matches`

**Upsert strategy:**

- Use `(team_id, season)` as the unique key for `kenpom_ratings`
- Delete existing player rows for a team before reinserting (players table doesn't have a stable unique key)

---

### `scrapers/odds_fetcher.py`

**Purpose:** Fetches betting lines and championship futures from The-Odds-API.
**Schedule:** 3x daily (8 AM, 2 PM, 8 PM ET) during tournament weeks.

**API Base URL:** `https://api.the-odds-api.com/v4`

**Endpoints to hit:**

1. Championship futures (pre-tournament and updated throughout):
   `GET /sports/basketball_ncaab/odds/?apiKey={key}&regions=us&markets=outrights&oddsFormat=american`

2. Game lines for each round (call when games exist):
   `GET /sports/basketball_ncaab/odds/?apiKey={key}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`

**What it does:**

1. Fetches all available NCAAB odds
2. Matches game home/away teams to `games` table records using team name fuzzy matching
3. For each bookmaker in response (draftkings, fanduel, betmgm, caesars), inserts a new row into `betting_odds` with current timestamp
4. Calculates `implied_prob` for each futures entry: for +odds: `100 / (odds + 100)`, for -odds: `abs(odds) / (abs(odds) + 100)`
5. Inserts new rows into `championship_futures` (don't upsert — keep history for movement tracking)
6. Logs remaining API requests from response headers `x-requests-remaining`

---

### `scrapers/historical_loader.py`

**Purpose:** One-time seed script. Loads static historical data.
**Schedule:** Run manually once, then never again (or re-run to refresh).

**What it does:**

**Part 1 — Seed performance history:**
Hardcode (or scrape from Sports Reference) the following data since 1985:

- For each seed (1-16) and each round (R64, R32, S16, E8, F4, Championship):
  - Games played
  - Wins
  - Win rate
  - Average margin in wins
  - Average margin in losses

Key historical facts to encode:

- 1 seeds: 156-0 in R64 (never lost as a 1 seed in R64... wait, that's not right. 1 seeds are 155-5 or similar in R64 — look this up accurately)
- Actually: No 16 seed won until UMBC beat Virginia in 2018. Since then 16 seeds are 1-159 in R64.
- Famous upsets: 5-12 (35% upset rate), 4-13, 3-14, 6-11 (most common upset seeds)

**Part 2 — Program tournament history:**
For each of the 68 tournament teams, load the last 10 years of KenPom program history data (season, rank, AdjEM, tournament result). This populates `kenpom_program_history`.

**Part 3 — NCAA all-time records:**
Update `teams` table with:

- `ncaa_titles` count
- `tournament_appearances` count
- `last_title_year`

---

### `scrapers/travel_calculator.py`

**Purpose:** Calculates travel distance from each team's campus to their first-round venue.
**Schedule:** Run once after bracket is set (March 15-16).

**What it does:**

1. Reads all teams with `campus_lat`, `campus_lng` from Supabase
2. Reads all Round 1 games with venue lat/lng
3. Uses `geopy.distance.geodesic` to calculate miles between campus and venue
4. Determines timezone of campus vs. venue using lat/lng lookup
5. Calculates timezone changes crossed (absolute difference in tz offsets)
6. Sets `flight_required` = True if distance > 400 miles
7. Sets `is_home_state` = True if team's `campus_state` matches venue state
8. Inserts rows into `team_travel` table

**Venue coordinates to hardcode:**

```python
VENUES = {
    "Dayton": {"city": "Dayton", "state": "OH", "lat": 39.7589, "lng": -84.1916},
    "Buffalo": {"city": "Buffalo", "state": "NY", "lat": 42.8864, "lng": -78.8784},
    "Greenville": {"city": "Greenville", "state": "SC", "lat": 34.8526, "lng": -82.3940},
    "Oklahoma City": {"city": "Oklahoma City", "state": "OK", "lat": 35.4676, "lng": -97.5164},
    "Portland": {"city": "Portland", "state": "OR", "lat": 45.5051, "lng": -122.6750},
    "Tampa": {"city": "Tampa", "state": "FL", "lat": 27.9506, "lng": -82.4572},
    "Philadelphia": {"city": "Philadelphia", "state": "PA", "lat": 39.9526, "lng": -75.1652},
    "San Diego": {"city": "San Diego", "state": "CA", "lat": 32.7157, "lng": -117.1611},
    "St. Louis": {"city": "St. Louis", "state": "MO", "lat": 38.6270, "lng": -90.1994},
    # Sweet 16 / Elite 8
    "Houston": {"city": "Houston", "state": "TX", "lat": 29.7604, "lng": -95.3698},
    "San Jose": {"city": "San Jose", "state": "CA", "lat": 37.3382, "lng": -121.8863},
    "Chicago": {"city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298},
    "Washington DC": {"city": "Washington", "state": "DC", "lat": 38.9072, "lng": -77.0369},
    # Final Four
    "Indianapolis": {"city": "Indianapolis", "state": "IN", "lat": 39.7684, "lng": -86.1581},
}
```

---

## GitHub Actions Workflows

### `.github/workflows/scrape_espn.yml`

```yaml
name: Scrape ESPN Bracket Data
on:
  schedule:
    - cron: "0 */2 * * *" # Every 2 hours
  workflow_dispatch: # Allow manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/espn_scraper.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### `.github/workflows/scrape_kenpom.yml`

```yaml
name: Scrape KenPom Data
on:
  schedule:
    - cron: "0 11 * * *" # 6 AM ET (11 AM UTC) daily
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/kenpom_scraper.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          KENPOM_EMAIL: ${{ secrets.KENPOM_EMAIL }}
          KENPOM_PASSWORD: ${{ secrets.KENPOM_PASSWORD }}
```

### `.github/workflows/scrape_odds.yml`

```yaml
name: Fetch Betting Odds
on:
  schedule:
    - cron: "0 13,19,1 * * *" # 8 AM, 2 PM, 8 PM ET (UTC+5 offset)
  workflow_dispatch:

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/odds_fetcher.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ODDS_API_KEY: ${{ secrets.ODDS_API_KEY }}
```

---

## Next.js App — Supabase Client Setup

### `lib/supabase/server.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

### `lib/supabase/client.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

Use the **server client** in all Server Components (avoids exposing service role key to browser).
Use the **browser client** only for client-side interactivity if needed.

### Next.js Caching Strategy

All Supabase queries in Server Components should use `revalidate` to control freshness:

- Bracket/game results: `revalidate = 300` (5 minutes)
- KenPom ratings: `revalidate = 3600` (1 hour)
- Betting odds: `revalidate = 1800` (30 minutes)
- Historical data: `revalidate = 86400` (24 hours, it's static)
- Team info: `revalidate = 3600`

Use Next.js `fetch` cache options or `unstable_cache` wrapper from `next/cache`.

---

## TypeScript Types (`lib/types/index.ts`)

```typescript
export interface Team {
  id: string;
  espn_id: string;
  name: string;
  full_name: string;
  slug: string;
  abbreviation: string;
  conference: string;
  seed: number;
  region: "East" | "West" | "Midwest" | "South";
  coach: string | null;
  record_wins: number | null;
  record_losses: number | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  campus_city: string | null;
  campus_state: string | null;
  ncaa_titles: number;
  tournament_appearances: number;
  last_title_year: number | null;
  is_first_four: boolean;
}

export interface KenpomRatings {
  id: string;
  team_id: string;
  season: number;
  kenpom_rank: number | null;
  adj_em: number | null;
  adj_o: number | null;
  adj_o_rank: number | null;
  adj_d: number | null;
  adj_d_rank: number | null;
  adj_t: number | null;
  adj_t_rank: number | null;
  luck: number | null;
  sos_adj_em: number | null;
  off_efg_pct: number | null;
  off_to_pct: number | null;
  off_or_pct: number | null;
  def_efg_pct: number | null;
  def_to_pct: number | null;
  def_or_pct: number | null;
  pct_2pt: number | null;
  pct_3pt: number | null;
  pct_ft: number | null;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: string | null;
  year_class: string | null;
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  off_rtg: number | null;
  usg_pct: number | null;
  efg_pct: number | null;
  ts_pct: number | null;
}

export interface Game {
  id: string;
  espn_game_id: string | null;
  round: number;
  round_name: string;
  region: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner_id: string | null;
  is_completed: boolean;
  is_upset: boolean;
  status: "scheduled" | "in_progress" | "final";
  // joined
  team1?: Team;
  team2?: Team;
  winner?: Team;
}

export interface BettingOdds {
  id: string;
  game_id: string;
  bookmaker: string;
  spread_team1: number | null;
  spread_team2: number | null;
  ml_team1: number | null;
  ml_team2: number | null;
  total_over: number | null;
  over_odds: number | null;
  under_odds: number | null;
  fetched_at: string;
}

export interface ChampionshipFuture {
  team_id: string;
  bookmaker: string;
  odds: number;
  implied_prob: number;
  fetched_at: string;
  team?: Team;
}

export interface HistoricalSeedData {
  seed: number;
  round: number;
  round_name: string;
  games_played: number;
  wins: number;
  win_rate: number;
  avg_margin_win: number | null;
  avg_margin_loss: number | null;
}

export interface TeamTravel {
  team_id: string;
  game_id: string;
  distance_miles: number | null;
  timezone_changes: number | null;
  flight_required: boolean;
  is_home_state: boolean;
  travel_notes: string | null;
}

export interface ProgramHistory {
  team_id: string;
  season: number;
  kenpom_rank: number | null;
  adj_em: number | null;
  tournament_seed: number | null;
  tournament_result: string | null;
  record: string | null;
}
```

---

## Design System

### Aesthetic Direction

**Dark sports analytics dashboard.** Think Bloomberg Terminal meets Linear. Dense data with perfect breathing room. Not flashy — authoritative. The kind of interface that makes users feel like they have insider information.

- Dark background (#0a0a0f)
- Subtle blue-tinted dark card surfaces (#12131a)
- Sharp accent color: electric blue (#3B82F6) for interactive elements and highlights
- Secondary accent: warm amber (#F59E0B) for betting/odds elements
- Success green (#10B981) for wins, upsets, positive trends
- Danger red (#EF4444) for losses, unfavorable matchups
- All text: white primary (#FAFAFA), muted secondary (#6B7280)
- Team colors used as accents on team-specific pages (pull from `primary_color` field)
- Geist Sans for UI, Geist Mono for all numbers/stats

### CSS Variables (in `globals.css`)

```css
:root {
  --bg-base: #0a0a0f;
  --bg-surface: #12131a;
  --bg-elevated: #1a1b25;
  --bg-hover: #1f2030;
  --border: #2a2b38;
  --border-subtle: #1e1f2e;
  --text-primary: #fafafa;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --accent-blue: #3b82f6;
  --accent-blue-dim: #1d4ed8;
  --accent-amber: #f59e0b;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

### Typography Scale

- Display (hero numbers, ranks): `text-5xl font-bold font-mono` (Geist Mono)
- Page title: `text-2xl font-semibold` (Geist Sans)
- Section header: `text-sm font-semibold uppercase tracking-widest text-muted`
- Body: `text-sm` (Geist Sans)
- Stat labels: `text-xs font-medium uppercase tracking-wider text-muted` (Geist Mono)
- Stat values: `text-lg font-bold font-mono`

### Shared Components to Build

**`components/ui/StatCard`** — A card with a label, large value, and optional rank badge.
Props: `label`, `value`, `rank`, `rankTotal`, `delta` (positive/negative change), `color`

**`components/ui/TeamBadge`** — Team logo + name + seed. Multiple sizes (sm, md, lg).
Props: `team`, `size`, `showSeed`, `showRecord`

**`components/ui/OddsChip`** — Displays American odds with color coding (+green, -red/neutral).
Props: `odds`, `label`

**`components/ui/RoundBadge`** — Colored pill showing round name.
Props: `round`, `roundName`

**`components/ui/ProgressBar`** — Horizontal bar for stat comparisons (used in matchup view).
Props: `value`, `max`, `color`, `label`

**`components/ui/SectionHeader`** — Consistent section label with optional subtitle.

**`components/ui/DataTable`** — Sortable table component for rankings and stats.
Props: `columns`, `data`, `defaultSort`

**`components/shared/Nav`** — Top navigation. Links: Home, Bracket, Teams, Matchups, Betting, Upsets.

- Logo/wordmark left
- Nav links center
- Mobile: hamburger → full-screen overlay nav
- Sticky, backdrop blur

**`components/shared/Footer`** — Minimal. Data attribution (KenPom, ESPN, The-Odds-API). Gambling disclaimer.

---

## Pages — Full Specifications

---

### Page 1: Home / Dashboard (`app/page.tsx`)

**Purpose:** Command center. Current state of the tournament at a glance.

**Layout:** Hero stat row → Today's/upcoming games → Live bracket snapshot → Top storylines

**Data fetched (server component):**

- All games where `is_completed = false` ordered by `scheduled_at` ASC (upcoming games)
- Last 3 completed games (recent results)
- Championship futures top 8 teams (most recent fetch per team)
- Count of upsets so far
- Current round in progress

**Sections:**

**Hero Stats Row** — 4 cards across:

1. "Tournament Favorite" — team name + odds (current DraftKings championship futures leader)
2. "Games Played" — X of 67
3. "Upsets This Year" — count from `is_upset = true`
4. "Next Game" — team vs. team + time

**Upcoming Games** — Card grid of the next 4-8 games. Each card shows:

- Team 1 vs Team 2 with seeds and logos
- Game time + venue city
- Spread (if available from betting_odds)
- KenPom win probability (calculated from AdjEM difference using log5 formula)
- "View Matchup" link

**Recent Results** — Horizontal scrollable row of completed games showing final scores, highlight upsets with amber border.

**Championship Odds Board** — Top 8 teams with current odds, logo, seed. Click → team page.

**Bracket Progress Visualization** — Simple tree diagram showing which slots are filled. Not the full interactive bracket (that's its own page) — just a compact overview.

---

### Page 2: Full Bracket (`app/bracket/page.tsx`)

**Purpose:** The full 68-team interactive bracket. Works on desktop and mobile.

**DESKTOP LAYOUT:**
Classic bracket tree, left-to-right flow:

- Left side: East + Midwest regions
- Right side: West + South regions
- Center: Final Four + Championship game
- 6 columns total (R64, R32, S16, E8, F4, Champ)

Each game slot is a `BracketGame` component:

- Two team rows with seed number + logo + name + record
- Completed games show final scores, winner highlighted with accent color
- TBD slots show "Winner of [game]" in muted text
- Hovering a game slot shows a popover with KenPom win probability and spread
- Clicking a game slot with two known teams navigates to `/matchups/[gameId]`
- Upsets highlighted with amber accent

**MOBILE LAYOUT:**
Round-by-round card view. Top of page shows round selector tabs:
`First Four | R64 | R32 | Sweet 16 | Elite 8 | Final Four | Championship`

Showing one round at a time. Each game is a full-width card:

```
┌─────────────────────────────────┐
│ [Logo] (5) Iowa State    72     │
│ [Logo] (12) UAB          68  ✓  │
│ Sweet 16 · Chicago · Mar 27     │
└─────────────────────────────────┘
```

**Region filter** on desktop: button group (All | East | West | Midwest | South) to highlight/dim regions.

**Data fetched:** All 67 games with team1, team2, winner joined. All teams. All kenpom_ratings for win probability calculation.

**Win Probability Calculation:**
Use the log5 formula based on KenPom AdjEM:

```
Probability = 1 / (1 + e^(-k * (AdjEM_A - AdjEM_B)))
where k ≈ 0.038 (calibrated to NCAA tournament margin)
```

Adjust for neutral court (no home court adjustment needed, all games neutral site).

---

### Page 3: All Teams (`app/teams/page.tsx`)

**Purpose:** Browse all 68 tournament teams with filtering and sorting.

**Layout:** Filter/sort bar → Grid of team cards

**Filters:**

- Region: All / East / West / Midwest / South
- Seed range: 1-4 / 5-8 / 9-12 / 13-16
- Conference: dropdown list of all conferences present

**Sort options:** Seed | KenPom Rank | AdjEM | Odds to win | AdjO | AdjD

**Team Card** (displayed in responsive grid, 4 cols desktop / 2 cols tablet / 1 col mobile):

```
┌─────────────────────────────┐
│ [Large logo]                │
│ (3) Iowa State              │
│ Big 12 · 27-7               │
│ ─────────────────────────   │
│ KenPom #6    AdjEM +32.42   │
│ AdjO 123.8   AdjD 91.4      │
│ Odds: +1500                 │
└─────────────────────────────┘
```

Cards are clickable → team detail page.

**Data fetched:** All teams joined with latest kenpom_ratings + latest championship_futures (aggregated best odds across books).

---

### Page 4: Team Detail (`app/teams/[slug]/page.tsx`)

**Purpose:** Deep dive on a single team. Everything you'd want to know before picking them in your bracket.

**URL pattern:** `/teams/duke-blue-devils`

**Layout:** Team hero → Stats grid → Players → Tournament path → Program history → Travel info

**Team Hero Section:**

- Full-width banner using team `primary_color` as gradient background
- Large team logo
- Team name, seed, region, conference, record, coach
- Championship odds across all books (comparison table)
- KenPom overall rank badge

**Core Analytics Grid (2x3 stat cards):**

1. KenPom Overall Rank + AdjEM
2. Offensive Rating (AdjO) + rank
3. Defensive Rating (AdjD) + rank
4. Tempo (AdjT) + rank
5. Luck rating + explanation tooltip
6. Strength of Schedule + rank

**Four Factors Panel:**
Two columns (Offense / Defense). For each: eFG%, TO%, OR%, FTR. Each stat shown as a bar compared to national average with rank.

**Scoring Breakdown:**
Donut or bar chart: % of points from 2PT / 3PT / FT.

**Key Players:**
Table of top 5-7 players. Columns: Name, Class, Min%, PPG, RPG, APG, ORtg, USG%, eFG%.

**Tournament Path:**
Visual list of their bracket path to the championship. Each potential opponent shown with their KenPom rank and win probability. Format:

```
Round 1:  vs (16) Siena          Win Prob: 97%
Round 2:  vs (8) Ohio St or (9) TCU  Win Prob: ~68%
Sweet 16: vs likely (4) or (5) seed  Win Prob: ~55%
...
```

**Travel & Logistics:**
Card showing: Distance to first-round venue, timezone changes, whether they're essentially playing a home game or cross-country trip.

**Program History Chart:**
Line chart (recharts) of KenPom AdjEM over last 10 seasons. Dots on the line for tournament appearances, different colors for different results (green = champion, yellow = Final Four, etc.).

**All-time Tournament Stats:**

- Total appearances
- All-time record (wins-losses)
- Championships won
- Last title year

**Data fetched:**

- Single team with all fields
- kenpom_ratings for this team
- kenpom_players for this team
- kenpom_program_history for this team (last 10 years)
- All games involving this team
- team_travel for this team
- championship_futures for this team (all books)

---

### Page 5: Matchup Analysis (`app/matchups/[gameId]/page.tsx`)

**Purpose:** Head-to-head breakdown for a specific game. The primary bracket-filling tool.

**Layout:** Matchup header → Side-by-side stats → Key matchup factors → Betting lines → Historical context

**Matchup Header:**

```
┌──────────────────────────────────────────────────┐
│  [Logo] Duke           vs        Michigan [Logo]  │
│  (1) East Region                    (1) Midwest   │
│                                                   │
│  Duke Win Prob: 52%  ████████░░  Michigan: 48%   │
│                                                   │
│  Final Four · April 4 · Indianapolis              │
└──────────────────────────────────────────────────┘
```

**Side-by-Side Comparison Table:**
Each row is a stat. Three columns: Team A value | Stat label | Team B value.
Higher value highlighted (green) for each stat. Rows:

- KenPom Overall Rank
- Adjusted Efficiency Margin
- Offensive Rating (AdjO)
- Defensive Rating (AdjD)
- Tempo (AdjT)
- Luck
- Strength of Schedule
- eFG% (Off)
- eFG% (Def)
- Turnover % (Off)
- Offensive Rebound %
- Season Record
- Last 10 games record

**Key Matchup Factors** (narrative analysis section):
Auto-generate 4-5 insight cards based on the data. Examples:

- "Duke ranks #2 in AdjD (89.1) vs Michigan's #8 AdjO (126.6) — elite offense vs. elite defense"
- "Michigan plays 4.2 possessions per game faster than Duke — tempo battle favors Duke"
- "Duke has +0.049 luck rating (overperforming) — some regression possible"
- Derive these dynamically using conditional logic on stat differences

**Betting Lines Panel:**
Table across bookmakers: Spread | ML Team 1 | ML Team 2 | Total O/U
Show best available line for each side, highlight line movement if we have historical fetches.

**Historical Seed Matchup Data:**
Based on the two seeds playing:

- "In games between (1) seeds and (3) seeds since 1985: 1-seed wins 78% of the time"
- "Average margin in 1 vs 3 matchups: 7.2 points"

**Head-to-Head History** (if available from ESPN data):
Last 3 times these programs met, with scores.

**Projected Score Range:**
Use KenPom's tempo + efficiency to project:

- Expected total score (AdjO_A × possessions + AdjO_B × possessions, adjusted for opponent defense)
- Show as range: "Projected total: 138-148 points"
- Compare to over/under line

**Data fetched:**

- Game with team1, team2, winner joined
- Both teams' kenpom_ratings
- Both teams' top 5 players
- betting_odds for this game (all books)
- historical_seed_data for the two seeds at this round
- team_travel for both teams (if first round)
- Past game results between teams (from games table, prior seasons if available)

---

### Page 6: Betting Dashboard (`app/betting/page.tsx`)

**Purpose:** All betting intelligence in one place. Championship futures, first-round lines, value identification.

**Layout:** Championship futures board → Round-by-round lines → Value picks

**Championship Futures Board:**
Full-width table. Columns: Team (logo + name + seed) | DraftKings | FanDuel | BetMGM | Caesars | Best Available | Implied Prob | KenPom Rank

Rows sorted by best available odds (shortest first = biggest favorites).
Highlight rows where KenPom rank suggests a team is undervalued by the market.

**Value Indicator Logic:**
For each team, compare their KenPom-derived win probability to their implied probability from betting markets.
KenPom probability: run a Monte Carlo simulation through the bracket using log5 win probabilities (can pre-calculate this in Python and store it as a field in kenpom_ratings).
If KenPom probability > market implied probability by > 5 percentage points → flag as "Value" with a green indicator.
If KenPom probability < market implied probability by > 5 percentage points → flag as "Fade" with a red indicator.

**Current Round Lines Table:**
For the current active round, show every game with:

- Teams (seeded)
- Spread (consensus across books)
- Moneyline (both sides)
- Over/Under
- KenPom win probability
- "KenPom Pick" badge on the team KenPom favors

**Odds Movement Chart:**
For top 6 teams, show a line chart of their championship odds over the last 72 hours (use `fetched_at` timestamps from `championship_futures` table).

**Upset Value Picks:**
Cards highlighting games where a lower seed has:

1. Positive KenPom value vs. market
2. Historical seed matchup data that favors them
3. Format: "(12) UAB vs (5) Iowa State: UAB +850, KenPom says 31% win probability vs. 10.5% implied"

**Gambling disclaimer:** Show at bottom of page, clearly visible.

**Data fetched:**

- All championship_futures (latest per team per book)
- All games for current round with betting_odds
- championship_futures with timestamps for movement chart
- historical_seed_data
- kenpom_ratings for all teams

---

### Page 7: Historical Upsets & Seed Data (`app/upsets/page.tsx`)

**Purpose:** Historical context for bracket filling. Seed win rates, famous upsets, trend data.

**Layout:** Seed performance grid → Upset probability chart → Famous upsets → 2026 upset tracker

**Seed Performance Matrix:**
Grid table. Rows = seeds 1-16. Columns = rounds (R64, R32, S16, E8, F4, Champ).
Each cell: win percentage + games played. Color coded green (high %) to red (low %).
Clicking any cell shows a drawer/modal with the specific game results.

**Most Upset-Prone Matchups:**
Ranked list of seed matchups by upset frequency:

1. 5 vs 12: 35.4% upset rate
2. 4 vs 13: 21.2%
3. 6 vs 11: 36.8%
   etc.
   With bar chart visualization.

**2026 Upset Tracker:**
If tournament is underway — live updating list of all upsets that have occurred, with margins and team names. Empty state with "Tournament begins March 17" before then.

**Historical Notable Upsets Panel:**
Cards highlighting famous upsets relevant to seeds in this year's bracket. E.g. if there's a 12 vs 5 game coming up, surface "12 seeds are 50-90 all-time against 5 seeds."

**Data fetched:**

- All historical_seed_data
- All completed games where is_upset = true (2026)
- All teams for current tournament

---

### Page 8: Team Comparison (`app/compare/page.tsx`)

**Purpose:** Compare any two teams side by side. Useful for debating bracket picks.

**URL supports query params:** `/compare?team1=duke-blue-devils&team2=michigan-wolverines`

**Layout:** Team selector dropdowns → Full comparison

**Team Selectors:**
Two searchable dropdowns. On select, updates URL query params (shareable links). On initial load with no params, show instruction state.

**Comparison Content:**
Same side-by-side layout as matchup page, but:

- No game/betting data (these teams may not be playing each other)
- Extended player comparison: top 3 players per team side by side
- Program history comparison: overlapping line chart of AdjEM over 10 years
- "Could They Meet?" section: shows the earliest possible round these two teams could face each other based on their bracket positions

**Data fetched:** Both teams with kenpom_ratings, players, program history, championship futures.

---

## Component Architecture Notes

### Server vs. Client Components

- All pages are **Server Components** by default — fetch data at render time, no client JavaScript for data loading
- Use `'use client'` only for:
  - Bracket interactive hover/click states
  - Team comparison selector dropdowns (search + filter)
  - Betting odds sort/filter
  - Mobile nav menu toggle
  - Any chart (recharts requires client)
- Data flows: Server Component fetches → passes as props to Client Components

### Loading States

Every page uses Next.js `loading.tsx` files for Suspense boundaries.
Loading skeletons that match the layout of the actual content. Use `animate-pulse` Tailwind class.
Never show a blank white/dark screen.

### Error States

Every page has `error.tsx`. Shows friendly message + "Data refreshes every X minutes" note.

### `not-found.tsx`

Custom 404 page. Suggest visiting the bracket or teams page.

---

## Utility Functions (`lib/utils/`)

### `lib/utils/probability.ts`

```typescript
// Log5 win probability from KenPom AdjEM values
export function getWinProbability(adjEmA: number, adjEmB: number): number {
  const k = 0.038;
  return 1 / (1 + Math.exp(-k * (adjEmA - adjEmB)));
}

// American odds to implied probability
export function oddsToImpliedProb(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

// Format American odds for display
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}
```

### `lib/utils/bracket.ts`

```typescript
// Get the round name from round number
export function getRoundName(round: number): string {
  const names: Record<number, string> = {
    0: "First Four",
    1: "Round of 64",
    2: "Round of 32",
    3: "Sweet 16",
    4: "Elite Eight",
    5: "Final Four",
    6: "Championship",
  };
  return names[round] ?? "Unknown";
}

// Get current active round
export function getCurrentRound(games: Game[]): number {
  const incomplete = games.filter((g) => !g.is_completed);
  if (incomplete.length === 0) return 6;
  return Math.min(...incomplete.map((g) => g.round));
}
```

### `lib/utils/format.ts`

```typescript
export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

export function formatEfficiency(value: number): string {
  return value.toFixed(1);
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
```

---

## Supabase Query Functions (`lib/queries/`)

### `lib/queries/teams.ts`

```typescript
export async function getAllTeams(supabase) {
  const { data } = await supabase
    .from("teams")
    .select(`*, kenpom_ratings(*), championship_futures(*)`)
    .order("seed", { ascending: true });
  return data;
}

export async function getTeamBySlug(supabase, slug: string) {
  const { data } = await supabase
    .from("teams")
    .select(
      `
      *,
      kenpom_ratings(*),
      kenpom_players(*),
      kenpom_program_history(*),
      team_travel(*, games(*))
    `,
    )
    .eq("slug", slug)
    .single();
  return data;
}
```

### `lib/queries/games.ts`

```typescript
export async function getAllGames(supabase) {
  const { data } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*),
      team2:teams!games_team2_id_fkey(*),
      winner:teams!games_winner_id_fkey(*)
    `,
    )
    .order("round", { ascending: true })
    .order("scheduled_at", { ascending: true });
  return data;
}

export async function getGameById(supabase, gameId: string) {
  const { data } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*, kenpom_ratings(*)),
      team2:teams!games_team2_id_fkey(*, kenpom_ratings(*)),
      betting_odds(*)
    `,
    )
    .eq("id", gameId)
    .single();
  return data;
}
```

### `lib/queries/betting.ts`

```typescript
export async function getLatestFutures(supabase) {
  // Get the most recent fetch timestamp
  const { data: latest } = await supabase
    .from("championship_futures")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return [];

  // Get all futures from that fetch
  const { data } = await supabase
    .from("championship_futures")
    .select(`*, team:teams(*)`)
    .gte(
      "fetched_at",
      new Date(
        new Date(latest.fetched_at).getTime() - 5 * 60 * 1000,
      ).toISOString(),
    )
    .order("odds", { ascending: true });

  return data;
}
```

---

## Tournament Reference Data

### 2026 Tournament Schedule

```
First Four:     March 17-18  (Dayton, OH)
Round of 64:    March 19-20
Round of 32:    March 21-22
Sweet 16:       March 26-27
Elite Eight:    March 28-29
Final Four:     April 4      (Indianapolis, IN)
Championship:   April 6      (Indianapolis, IN)
```

### Region Seeds

```
East Region (1-seed: Duke, Durham NC)
West Region (1-seed: Arizona, Tucson AZ)
Midwest Region (1-seed: Michigan, Ann Arbor MI)
South Region (1-seed: Florida, Gainesville FL)
```

### First/Second Round Sites

```
Buffalo, NY
Greenville, SC
Oklahoma City, OK
Portland, OR
Tampa, FL
Philadelphia, PA
San Diego, CA
St. Louis, MO
```

### Sweet 16 / Elite 8 Sites

```
East Region:    Washington, D.C.
West Region:    San Jose, CA
Midwest Region: Chicago, IL
South Region:   Houston, TX
```

---

## Deployment

### Vercel (Frontend)

- Connect GitHub repo to Vercel
- Set root directory to `apps/web`
- Add all environment variables from `.env.local`
- Enable automatic deployments on push to `main`

### GitHub Actions (Scrapers)

- Add all secrets under repo Settings → Secrets and variables → Actions
- Workflows are pre-configured in `.github/workflows/`
- Run `historical_loader.py` and `travel_calculator.py` manually once to seed initial data
- Verify ESPN and KenPom scrapers by triggering manually first

### Build order

1. Create Supabase project, run migrations (`001_initial_schema.sql`)
2. Set up all environment variables locally and in GitHub Secrets
3. Run `historical_loader.py` manually to seed seed data
4. Run `espn_scraper.py` manually to populate teams and bracket
5. Run `kenpom_scraper.py` manually to populate ratings
6. Run `odds_fetcher.py` manually to populate betting lines
7. Run `travel_calculator.py` manually
8. Deploy Next.js app to Vercel
9. Enable GitHub Actions workflows

---

## Important Notes for Claude Code

1. **TypeScript strict mode** — enable `strict: true` in tsconfig.json
2. **No `any` types** — define proper types for everything
3. **Server components first** — only use `'use client'` when genuinely needed
4. **Mobile-first CSS** — write mobile styles first, add `md:` and `lg:` breakpoints
5. **Error boundaries** — every page needs an `error.tsx`
6. **Loading states** — every page needs a `loading.tsx` with skeleton UI
7. **Accessibility** — semantic HTML, proper aria labels on interactive elements
8. **Image optimization** — use Next.js `<Image>` component for all team logos
9. **No hardcoded team data in components** — everything comes from Supabase
10. **All monetary/odds values** — store as integers (American odds), convert for display
11. **Win probability** — always calculate at render time from KenPom data, don't store in DB
12. **Responsive bracket** — desktop = horizontal tree, mobile = round-by-round cards (two entirely different layouts)
13. **Geist font** — install `geist` npm package, configure in `layout.tsx`
14. **Recharts** — all charts use `ResponsiveContainer` wrapping, always set explicit height
15. **KenPom data** — when KenPom data hasn't been scraped yet, show graceful "Data loading" placeholder, never crash
