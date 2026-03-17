-- Add coach experience columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_tenure_years INTEGER;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_tournament_apps INTEGER;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_is_first_year BOOLEAN DEFAULT FALSE;
