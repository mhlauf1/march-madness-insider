# BurgerLab — TODO

## Data Pipeline
- [x] Fix ESPN scraper record parsing (use team detail API `record.items[0].summary`)
- [x] Fix ESPN scraper region parsing (parse from `notes[0].headline`)
- [x] Fix ESPN scraper conference parsing (use `standingSummary` + fallbacks)
- [x] Fix ESPN scraper round map (add "1st Round", "2nd Round", etc.)
- [x] Fix KenPom scraper column mappings (`AdjO.Rank`, `SOS-AdjEM`, etc.)
- [x] Fix KenPom scraper four factors (use `get_fourfactors()` instead of `get_teamstats()`)
- [x] Fix KenPom name matching (normalized matching in `_find_team_row`)
- [x] Add conference update from KenPom `Conf` column
- [ ] Add campus coordinates to teams (geocode from city/state)
- [ ] Add program history scraping (fix column mapping)
- [ ] Add W-L record from KenPom as fallback
- [ ] Add points distribution data (verify kenpompy columns)
- [ ] Re-run all scrapers with fixes applied
- [ ] Verify Duke shows KenPom #1, AdjEM +38.90, record 32-2, East region, ACC

## Teams Page
- [ ] Show correct KenPom ranks, ratings, four factors
- [ ] Show team records (W-L)
- [ ] Show conferences and regions correctly
- [ ] Add search/filter by name
- [ ] Highlight eliminated teams (greyed out)

## Team Detail Page
- [ ] Full KenPom stat breakdown with ranks
- [ ] Four Factors bars with national average comparison
- [ ] Player roster table (PPG, RPG, APG, ORtg, Usage%)
- [ ] Points distribution chart (2PT/3PT/FT donut/bar)
- [ ] Program history line chart (recharts)
- [ ] Tournament path with projected matchups + win probabilities
- [ ] Championship odds across bookmakers
- [ ] Travel info card

## Bracket Page
- [ ] Desktop bracket tree view (6 columns)
- [ ] Region filter buttons
- [ ] Game hover popovers (win prob + spread)
- [ ] Click to navigate to matchup detail
- [ ] Highlight upsets with amber
- [ ] Mobile round-tab view

## Home Dashboard
- [ ] Hero stats (favorite, games played, upsets, next game)
- [ ] Upcoming games with spread + KenPom win probability
- [ ] Recent results with upset highlighting
- [ ] Championship odds board (top 8)
- [ ] Bracket progress mini-visualization

## Matchup Page
- [ ] Head-to-head comparison with win probability bar
- [ ] Side-by-side KenPom stats
- [ ] Key matchup insight cards (auto-generated)
- [ ] Betting lines across bookmakers
- [ ] Historical seed matchup data
- [ ] Projected score range

## Betting Page
- [ ] Championship futures board (all books)
- [ ] Current round game lines table
- [ ] Value indicator (KenPom vs market implied prob)
- [ ] Odds movement chart (recharts)
- [ ] Upset value picks section

## Upsets Page
- [ ] Seed performance matrix (color-coded grid)
- [ ] 2026 upset tracker (live)
- [ ] Most upset-prone matchups chart
- [ ] Historical notable upsets

## Compare Page
- [ ] Two searchable team dropdowns
- [ ] Side-by-side stat comparison
- [ ] Player comparison
- [ ] Program history overlay chart
- [ ] "Could They Meet?" bracket path analysis

## Polish & Deploy
- [ ] Framer-motion page transitions
- [ ] OG/meta images for social sharing
- [ ] Favicon/app icon
- [ ] Vercel deployment
- [ ] GitHub Actions secrets configured
- [ ] Performance audit (Lighthouse)
