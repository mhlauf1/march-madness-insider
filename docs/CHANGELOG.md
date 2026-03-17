# Changelog

## 2026-03-16 — Initial Build

### Added
- Full project scaffold from create-next-app, migrated to pnpm
- Dark design system with CSS variables and Tailwind v4 theme
- Database schema: 9 tables (teams, games, kenpom_ratings, kenpom_players, kenpom_program_history, betting_odds, championship_futures, historical_seed_data, team_travel)
- Python scrapers: ESPN bracket, KenPom analytics, betting odds, historical data, travel calculator
- GitHub Actions: cron workflows for automated scraping
- Supabase client setup (server + browser)
- TypeScript types for all database entities
- Utility functions: probability calculations, bracket helpers, formatting
- Query functions: teams, games, betting, historical, kenpom
- UI components: StatCard, TeamBadge, OddsChip, RoundBadge, ProgressBar, SectionHeader, DataTable
- Layout: Nav with mobile menu, Footer with data attribution and gambling disclaimer
- Pages: Home dashboard, Bracket, Teams list, Team detail, Matchup analysis, Betting dashboard, Upsets/historical, Team comparison, Custom 404
- Loading skeletons and error boundaries for all routes
- Documentation: SPEC, ARCHITECTURE, STATUS, TODO, CHANGELOG, SCRAPER_GUIDE, DEPLOYMENT
