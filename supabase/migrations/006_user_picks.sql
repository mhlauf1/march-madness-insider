-- User bracket picks table
CREATE TABLE IF NOT EXISTS user_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  picked_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round INT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Indexes
CREATE INDEX idx_user_picks_user_id ON user_picks(user_id);
CREATE INDEX idx_user_picks_game_id ON user_picks(game_id);
CREATE INDEX idx_user_picks_user_round ON user_picks(user_id, round);

-- Reuse existing trigger
CREATE TRIGGER set_user_picks_updated_at
  BEFORE UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: users can only CRUD their own picks
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own picks"
  ON user_picks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own picks"
  ON user_picks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own picks"
  ON user_picks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own picks"
  ON user_picks FOR DELETE
  USING (auth.uid() = user_id);
