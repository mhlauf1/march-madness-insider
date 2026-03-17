export interface Team {
  id: string;
  espn_id: string;
  name: string;
  full_name: string;
  slug: string;
  abbreviation: string;
  conference: string;
  seed: number;
  region: "East" | "West" | "Midwest" | "South";
  coach: string | null;
  coach_tenure_years: number | null;
  coach_tournament_apps: number | null;
  coach_is_first_year: boolean;
  record_wins: number | null;
  record_losses: number | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  campus_city: string | null;
  campus_state: string | null;
  ncaa_titles: number;
  tournament_appearances: number;
  last_title_year: number | null;
  is_first_four: boolean;
}

export interface KenpomRatings {
  id: string;
  team_id: string;
  season: number;
  kenpom_rank: number | null;
  adj_em: number | null;
  adj_o: number | null;
  adj_o_rank: number | null;
  adj_d: number | null;
  adj_d_rank: number | null;
  adj_t: number | null;
  adj_t_rank: number | null;
  luck: number | null;
  luck_rank: number | null;
  sos_adj_em: number | null;
  sos_adj_em_rank: number | null;
  off_efg_pct: number | null;
  off_to_pct: number | null;
  off_or_pct: number | null;
  off_ftr: number | null;
  def_efg_pct: number | null;
  def_to_pct: number | null;
  def_or_pct: number | null;
  def_ftr: number | null;
  pct_2pt: number | null;
  pct_3pt: number | null;
  pct_ft: number | null;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: string | null;
  height: string | null;
  year_class: string | null;
  minutes_pct: number | null;
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  off_rtg: number | null;
  usg_pct: number | null;
  efg_pct: number | null;
  ts_pct: number | null;
}

export interface Game {
  id: string;
  espn_game_id: string | null;
  round: number;
  round_name: string;
  region: string | null;
  game_number: number | null;
  scheduled_at: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner_id: string | null;
  is_completed: boolean;
  is_upset: boolean;
  kenpom_fanmatch: number | null;
  status: "scheduled" | "in_progress" | "final";
  team1?: Team;
  team2?: Team;
  winner?: Team;
}

export interface BettingOdds {
  id: string;
  game_id: string;
  bookmaker: string;
  spread_team1: number | null;
  spread_team2: number | null;
  ml_team1: number | null;
  ml_team2: number | null;
  total_over: number | null;
  total_under: number | null;
  over_odds: number | null;
  under_odds: number | null;
  fetched_at: string;
}

export interface ChampionshipFuture {
  id: string;
  team_id: string;
  bookmaker: string;
  odds: number;
  implied_prob: number;
  fetched_at: string;
  team?: Team;
}

export interface HistoricalSeedData {
  id: string;
  seed: number;
  round: number;
  round_name: string;
  games_played: number;
  wins: number;
  win_rate: number;
  avg_margin_win: number | null;
  avg_margin_loss: number | null;
}

export interface TeamSeasonStats {
  id: string;
  team_id: string;
  season: number;
  ppg: number | null;
  opp_ppg: number | null;
  first_half_ppg: number | null;
  second_half_ppg: number | null;
  opp_first_half_ppg: number | null;
  opp_second_half_ppg: number | null;
  avg_margin: number | null;
  games_played: number | null;
  avg_turnovers: number | null;
  avg_off_rebounds: number | null;
  avg_assists: number | null;
  avg_steals: number | null;
  avg_blocks: number | null;
  ft_pct: number | null;
  avg_fta: number | null;
  efg_pct: number | null;
  avg_3pa: number | null;
  avg_3pm: number | null;
  three_pt_pct: number | null;
  scraped_at: string;
}

export interface GameTeamStats {
  id: string;
  game_id: string;
  team_id: string;
  first_half_pts: number | null;
  second_half_pts: number | null;
  ot_pts: number | null;
  total_pts: number | null;
  scraped_at: string;
}

export interface TeamTravel {
  id: string;
  team_id: string;
  game_id: string;
  distance_miles: number | null;
  timezone_changes: number | null;
  flight_required: boolean;
  is_home_state: boolean;
  travel_notes: string | null;
}

export interface ProgramHistory {
  id: string;
  team_id: string;
  season: number;
  kenpom_rank: number | null;
  adj_em: number | null;
  adj_o: number | null;
  adj_d: number | null;
  record: string | null;
  tournament_seed: number | null;
  tournament_result: string | null;
}

export interface TeamWithRatings extends Team {
  kenpom_ratings: KenpomRatings[];
  championship_futures?: ChampionshipFuture[];
}

export interface TeamDetail extends Team {
  kenpom_ratings: KenpomRatings[];
  kenpom_players: Player[];
  kenpom_program_history: ProgramHistory[];
  team_travel: (TeamTravel & { games: Game })[];
  team_season_stats: TeamSeasonStats[];
}

export interface TeamWithFullStats extends Team {
  kenpom_ratings: KenpomRatings[];
  championship_futures: ChampionshipFuture[];
  kenpom_players: Player[];
  team_season_stats: TeamSeasonStats[];
  experience_score: number | null;
}

export interface UserPick {
  id: string;
  user_id: string;
  game_id: string;
  picked_team_id: string;
  round: number;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameWithTeams extends Omit<Game, "team1" | "team2"> {
  team1: (Team & { kenpom_ratings: KenpomRatings[]; kenpom_players?: Player[] }) | null;
  team2: (Team & { kenpom_ratings: KenpomRatings[]; kenpom_players?: Player[] }) | null;
  betting_odds?: BettingOdds[];
}
