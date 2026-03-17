-- Deduplicate existing rows (keep lowest id per team/season/name group)
DELETE FROM kenpom_players a USING kenpom_players b
WHERE a.team_id = b.team_id AND a.season = b.season AND a.name = b.name AND a.id > b.id;

-- Prevent future duplicates
ALTER TABLE kenpom_players
ADD CONSTRAINT unique_team_season_player UNIQUE (team_id, season, name);
