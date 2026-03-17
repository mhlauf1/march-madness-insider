-- BurgerLab: Scoring Stats Tables
-- Team season averages and per-game half scoring data

-- ============================================
-- Table: team_season_stats
-- ============================================
CREATE TABLE team_season_stats (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             UUID REFERENCES teams(id) ON DELETE CASCADE,
  season              INTEGER NOT NULL DEFAULT 2026,
  ppg                 DECIMAL(5,1),
  opp_ppg             DECIMAL(5,1),
  first_half_ppg      DECIMAL(5,1),
  second_half_ppg     DECIMAL(5,1),
  opp_first_half_ppg  DECIMAL(5,1),
  opp_second_half_ppg DECIMAL(5,1),
  avg_margin          DECIMAL(5,1),
  games_played        INTEGER,
  scraped_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, season)
);

-- ============================================
-- Table: game_team_stats
-- ============================================
CREATE TABLE game_team_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  first_half_pts  INTEGER,
  second_half_pts INTEGER,
  ot_pts          INTEGER DEFAULT 0,
  total_pts       INTEGER,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (game_id, team_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_season_stats_team ON team_season_stats(team_id);
CREATE INDEX idx_game_team_stats_game ON game_team_stats(game_id);
CREATE INDEX idx_game_team_stats_team ON game_team_stats(team_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE team_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_team_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON team_season_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON game_team_stats FOR SELECT USING (true);
