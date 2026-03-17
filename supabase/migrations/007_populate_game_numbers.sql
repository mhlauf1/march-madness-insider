-- Populate game_number for all games so bracket advancement works.
-- game_number links games across rounds: game N in round R feeds into
-- game ceil(N/2) in round R+1 within the same region.

BEGIN;

-- ============================================
-- R64 (round 1): Assign game_number based on bracket seed position
-- Standard bracket order: 1v16=1, 8v9=2, 5v12=3, 4v13=4, 6v11=5, 3v14=6, 7v10=7, 2v15=8
-- ============================================
UPDATE games g
SET game_number = CASE min_seed
  WHEN 1 THEN 1
  WHEN 8 THEN 2
  WHEN 5 THEN 3
  WHEN 4 THEN 4
  WHEN 6 THEN 5
  WHEN 3 THEN 6
  WHEN 7 THEN 7
  WHEN 2 THEN 8
END
FROM (
  SELECT g2.id,
         LEAST(t1.seed, t2.seed) AS min_seed
  FROM games g2
  JOIN teams t1 ON g2.team1_id = t1.id
  JOIN teams t2 ON g2.team2_id = t2.id
  WHERE g2.round = 1
) sub
WHERE g.id = sub.id;

-- ============================================
-- R32 (round 2): 4 games per region, numbered 1-4
-- ============================================
UPDATE games g
SET game_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY region ORDER BY id) AS rn
  FROM games
  WHERE round = 2
) sub
WHERE g.id = sub.id;

-- ============================================
-- S16 (round 3): 2 games per region, numbered 1-2
-- ============================================
UPDATE games g
SET game_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY region ORDER BY id) AS rn
  FROM games
  WHERE round = 3
) sub
WHERE g.id = sub.id;

-- ============================================
-- E8 (round 4): 1 game per region, game_number = 1
-- ============================================
UPDATE games
SET game_number = 1
WHERE round = 4;

-- ============================================
-- F4 (round 5): 2 games
-- Game 1 = East/Midwest side, Game 2 = West/South side
-- Matches F4_REGION_MAP in bracket-structure.ts
-- ============================================
UPDATE games g
SET game_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM games
  WHERE round = 5
) sub
WHERE g.id = sub.id;

-- ============================================
-- NCG (round 6): 1 game, game_number = 1
-- ============================================
UPDATE games
SET game_number = 1
WHERE round = 6;

COMMIT;
