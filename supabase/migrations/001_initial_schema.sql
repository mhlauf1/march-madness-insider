-- BurgerLab: March Madness 2026 Database Schema
-- Run this migration against your Supabase project

-- ============================================
-- Table: teams
-- ============================================
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espn_id         TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  abbreviation    TEXT NOT NULL,
  conference      TEXT NOT NULL,
  seed            INTEGER NOT NULL,
  region          TEXT NOT NULL,
  coach           TEXT,
  record_wins     INTEGER,
  record_losses   INTEGER,
  logo_url        TEXT,
  primary_color   TEXT,
  secondary_color TEXT,
  campus_city     TEXT,
  campus_state    TEXT,
  campus_lat      DECIMAL(9,6),
  campus_lng      DECIMAL(9,6),
  ncaa_titles     INTEGER DEFAULT 0,
  tournament_appearances INTEGER DEFAULT 0,
  last_title_year INTEGER,
  is_first_four   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: kenpom_ratings
-- ============================================
CREATE TABLE kenpom_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL DEFAULT 2026,
  kenpom_rank     INTEGER,
  adj_em          DECIMAL(6,2),
  adj_o           DECIMAL(6,2),
  adj_o_rank      INTEGER,
  adj_d           DECIMAL(6,2),
  adj_d_rank      INTEGER,
  adj_t           DECIMAL(5,2),
  adj_t_rank      INTEGER,
  luck            DECIMAL(5,3),
  luck_rank       INTEGER,
  sos_adj_em      DECIMAL(6,2),
  sos_adj_em_rank INTEGER,
  sos_opp_o       DECIMAL(6,2),
  sos_opp_d       DECIMAL(6,2),
  ncsos_adj_em    DECIMAL(6,2),
  ncsos_rank      INTEGER,
  off_efg_pct     DECIMAL(5,3),
  off_to_pct      DECIMAL(5,3),
  off_or_pct      DECIMAL(5,3),
  off_ftr         DECIMAL(5,3),
  def_efg_pct     DECIMAL(5,3),
  def_to_pct      DECIMAL(5,3),
  def_or_pct      DECIMAL(5,3),
  def_ftr         DECIMAL(5,3),
  pct_2pt         DECIMAL(5,3),
  pct_3pt         DECIMAL(5,3),
  pct_ft          DECIMAL(5,3),
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, season)
);

-- ============================================
-- Table: kenpom_players
-- ============================================
CREATE TABLE kenpom_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL DEFAULT 2026,
  name            TEXT NOT NULL,
  position        TEXT,
  height          TEXT,
  year_class      TEXT,
  minutes_pct     DECIMAL(5,1),
  ppg             DECIMAL(5,1),
  rpg             DECIMAL(4,1),
  apg             DECIMAL(4,1),
  off_rtg         DECIMAL(6,1),
  usg_pct         DECIMAL(5,1),
  efg_pct         DECIMAL(5,3),
  ts_pct          DECIMAL(5,3),
  scraped_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: kenpom_program_history
-- ============================================
CREATE TABLE kenpom_program_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  season          INTEGER NOT NULL,
  kenpom_rank     INTEGER,
  adj_em          DECIMAL(6,2),
  adj_o           DECIMAL(6,2),
  adj_d           DECIMAL(6,2),
  record          TEXT,
  tournament_seed INTEGER,
  tournament_result TEXT,
  UNIQUE (team_id, season)
);

-- ============================================
-- Table: games
-- ============================================
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espn_game_id    TEXT UNIQUE,
  round           INTEGER NOT NULL,
  round_name      TEXT NOT NULL,
  region          TEXT,
  game_number     INTEGER,
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
  is_upset        BOOLEAN DEFAULT FALSE,
  kenpom_fanmatch DECIMAL(5,2),
  status          TEXT DEFAULT 'scheduled',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: betting_odds
-- ============================================
CREATE TABLE betting_odds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,
  bookmaker       TEXT NOT NULL,
  spread_team1    DECIMAL(5,2),
  spread_team2    DECIMAL(5,2),
  ml_team1        INTEGER,
  ml_team2        INTEGER,
  total_over      DECIMAL(5,2),
  total_under     DECIMAL(5,2),
  over_odds       INTEGER,
  under_odds      INTEGER,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: championship_futures
-- ============================================
CREATE TABLE championship_futures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  bookmaker       TEXT NOT NULL,
  odds            INTEGER NOT NULL,
  implied_prob    DECIMAL(5,4),
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: historical_seed_data
-- ============================================
CREATE TABLE historical_seed_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed            INTEGER NOT NULL,
  round           INTEGER NOT NULL,
  round_name      TEXT NOT NULL,
  games_played    INTEGER NOT NULL,
  wins            INTEGER NOT NULL,
  win_rate        DECIMAL(5,4) NOT NULL,
  avg_margin_win  DECIMAL(5,2),
  avg_margin_loss DECIMAL(5,2),
  UNIQUE (seed, round)
);

-- ============================================
-- Table: team_travel
-- ============================================
CREATE TABLE team_travel (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,
  distance_miles  INTEGER,
  timezone_changes INTEGER,
  flight_required BOOLEAN,
  is_home_state   BOOLEAN,
  travel_notes    TEXT
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_games_round ON games(round);
CREATE INDEX idx_games_region ON games(region);
CREATE INDEX idx_games_team1 ON games(team1_id);
CREATE INDEX idx_games_team2 ON games(team2_id);
CREATE INDEX idx_betting_odds_game ON betting_odds(game_id);
CREATE INDEX idx_futures_team ON championship_futures(team_id);
CREATE INDEX idx_futures_fetched ON championship_futures(fetched_at DESC);
CREATE INDEX idx_kenpom_team ON kenpom_ratings(team_id);
CREATE INDEX idx_history_team ON kenpom_program_history(team_id, season);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kenpom_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kenpom_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE kenpom_program_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_futures ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_seed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_travel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read" ON kenpom_ratings FOR SELECT USING (true);
CREATE POLICY "Public read" ON kenpom_players FOR SELECT USING (true);
CREATE POLICY "Public read" ON kenpom_program_history FOR SELECT USING (true);
CREATE POLICY "Public read" ON games FOR SELECT USING (true);
CREATE POLICY "Public read" ON betting_odds FOR SELECT USING (true);
CREATE POLICY "Public read" ON championship_futures FOR SELECT USING (true);
CREATE POLICY "Public read" ON historical_seed_data FOR SELECT USING (true);
CREATE POLICY "Public read" ON team_travel FOR SELECT USING (true);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
