-- Add 3-point attempts per game to team_season_stats
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_3pa DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_3pm DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS three_pt_pct DECIMAL(4,1);
