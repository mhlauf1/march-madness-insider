-- Add ESPN counting stats to team_season_stats
-- Run these ALTER statements in Supabase Dashboard SQL Editor

ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_turnovers DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_off_rebounds DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_assists DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_steals DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_blocks DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS ft_pct DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS efg_pct DECIMAL(4,1);
ALTER TABLE team_season_stats ADD COLUMN IF NOT EXISTS avg_fta DECIMAL(4,1);
