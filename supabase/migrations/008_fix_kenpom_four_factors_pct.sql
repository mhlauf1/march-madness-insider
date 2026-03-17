-- Fix KenPom four factors: convert from percentage (55.4) to decimal (0.554)
-- to match frontend formatPct() which multiplies by 100.
-- Guard: only update rows where values are still in percentage form (> 1).
UPDATE kenpom_ratings SET
  off_efg_pct = off_efg_pct / 100,
  off_to_pct  = off_to_pct  / 100,
  off_or_pct  = off_or_pct  / 100,
  off_ftr     = off_ftr     / 100,
  def_efg_pct = def_efg_pct / 100,
  def_to_pct  = def_to_pct  / 100,
  def_or_pct  = def_or_pct  / 100,
  def_ftr     = def_ftr     / 100
WHERE off_efg_pct > 1;
