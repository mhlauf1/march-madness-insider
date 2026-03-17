# BurgerLab Architecture

## System Overview

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Next.js App │────▶│   Supabase    │◀────│   Python     │
│  (Vercel)    │     │  (Postgres)   │     │  Scrapers    │
└──────────────┘     └───────────────┘     └──────────────┘
                                                  ▲
                                                  │
                                           ┌──────┴───────┐
                                           │ GitHub       │
                                           │ Actions Cron │
                                           └──────────────┘
```

## Data Flow

1. **GitHub Actions** trigger Python scrapers on schedule
2. **Scrapers** fetch data from ESPN API, KenPom, The-Odds-API
3. **Scrapers** upsert data into Supabase Postgres via service role key
4. **Next.js Server Components** query Supabase at render time
5. **ISR (revalidate)** caches pages for defined intervals

## Caching Strategy

| Data Type | Revalidate | Reason |
|---|---|---|
| Games/Bracket | 300s (5 min) | Scores change during games |
| Betting Odds | 1800s (30 min) | Fetched 3x daily |
| KenPom Ratings | 3600s (1 hour) | Updated once daily |
| Team Info | 3600s (1 hour) | Rarely changes |
| Historical Data | 86400s (24 hours) | Static |

## Component Hierarchy

```
RootLayout
├── Nav (client — mobile menu toggle)
├── Pages (server — data fetching)
│   ├── Home → StatCards, TeamBadge, OddsChip
│   ├── Bracket → BracketView (client — tabs/interaction)
│   ├── Teams → TeamGrid (client — filter/sort)
│   │   └── [slug] → StatCard, ProgressBar, PlayerTable
│   ├── Matchups/[gameId] → comparison tables
│   ├── Betting → DataTable (client — sort)
│   ├── Upsets → seed matrix, upset tracker
│   └── Compare → team selectors (client)
└── Footer
```

## Server vs Client Components

- All pages are Server Components by default (data fetching, no JS shipped)
- `'use client'` only for: Nav menu, BracketView tabs, TeamGrid filters, DataTable sorting, Compare dropdowns, charts (recharts)
- Data flows: Server fetches → passes as props to Client Components

## Database

- 9 tables in Supabase Postgres
- RLS enabled, public SELECT only
- Service role key used by scrapers and server components
- Anon key available for client-side queries if needed

## Key Libraries

- **@supabase/supabase-js** — database client
- **recharts** — charts (client components)
- **framer-motion** — animations
- **lucide-react** — icons
- **date-fns** — date formatting
