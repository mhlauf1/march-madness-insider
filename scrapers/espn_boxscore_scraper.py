"""
ESPN Box Score & Season Stats Scraper
Pulls team season scoring averages and per-game half scores.
Schedule: Daily at 7 AM ET during tournament.
"""

import os
import sys
import logging
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TEAM_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{}"
TEAM_STATS_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{}/statistics"
GAME_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary"


def fetch_json(url: str, params: dict | None = None) -> dict:
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_record_stat(record_items: list, record_type: str, stat_name: str) -> float | None:
    """Extract a stat from ESPN team record items."""
    for item in record_items:
        if item.get("type") == record_type:
            for stat in item.get("stats", []):
                if stat.get("name") == stat_name:
                    try:
                        return float(stat["value"])
                    except (ValueError, KeyError):
                        return None
    return None


def get_stat_value(categories: list, category_name: str, stat_name: str) -> float | None:
    """Extract a stat value from ESPN team statistics categories."""
    for cat in categories:
        if cat.get("name") == category_name or cat.get("displayName", "").lower() == category_name.lower():
            for stat in cat.get("stats", []):
                if stat.get("name") == stat_name:
                    try:
                        return float(stat["value"])
                    except (ValueError, KeyError):
                        return None
    return None


def fetch_counting_stats(espn_id: str) -> dict:
    """Fetch counting stats from ESPN team statistics endpoint."""
    try:
        data = fetch_json(TEAM_STATS_URL.format(espn_id))
    except Exception:
        return {}

    categories = data.get("results", {}).get("stats", {}).get("categories", [])
    if not categories:
        # Try alternate response shape
        stats_data = data.get("stats", [])
        if stats_data:
            categories = stats_data

    avg_turnovers = get_stat_value(categories, "offensive", "avgTurnovers")
    avg_off_rebounds = get_stat_value(categories, "offensive", "avgOffensiveRebounds")
    avg_assists = get_stat_value(categories, "offensive", "avgAssists")
    avg_steals = get_stat_value(categories, "defensive", "avgSteals")
    avg_blocks = get_stat_value(categories, "defensive", "avgBlocks")
    ft_pct = get_stat_value(categories, "offensive", "freeThrowPct")
    avg_fta = get_stat_value(categories, "offensive", "avgFreeThrowsAttempted")

    # Compute eFG% = (FGM + 0.5 * 3PM) / FGA
    fgm = get_stat_value(categories, "offensive", "fieldGoalsMade")
    tpm = get_stat_value(categories, "offensive", "threePointFieldGoalsMade")
    fga = get_stat_value(categories, "offensive", "fieldGoalsAttempted")
    tpa = get_stat_value(categories, "offensive", "threePointFieldGoalsAttempted")
    efg_pct = None
    if fgm is not None and tpm is not None and fga is not None and fga > 0:
        efg_pct = round((fgm + 0.5 * tpm) / fga * 100, 1)

    # 3-point shooting: per-game averages and percentage
    avg_3pa = get_stat_value(categories, "offensive", "avgThreePointFieldGoalsAttempted")
    avg_3pm = get_stat_value(categories, "offensive", "avgThreePointFieldGoalsMade")
    three_pt_pct = None
    if tpm is not None and tpa is not None and tpa > 0:
        three_pt_pct = round(tpm / tpa * 100, 1)

    result = {}
    if avg_turnovers is not None:
        result["avg_turnovers"] = round(avg_turnovers, 1)
    if avg_off_rebounds is not None:
        result["avg_off_rebounds"] = round(avg_off_rebounds, 1)
    if avg_assists is not None:
        result["avg_assists"] = round(avg_assists, 1)
    if avg_steals is not None:
        result["avg_steals"] = round(avg_steals, 1)
    if avg_blocks is not None:
        result["avg_blocks"] = round(avg_blocks, 1)
    if ft_pct is not None:
        result["ft_pct"] = round(ft_pct, 1)
    if avg_fta is not None:
        result["avg_fta"] = round(avg_fta, 1)
    if efg_pct is not None:
        result["efg_pct"] = round(efg_pct, 1)
    if avg_3pa is not None:
        result["avg_3pa"] = round(avg_3pa, 1)
    if avg_3pm is not None:
        result["avg_3pm"] = round(avg_3pm, 1)
    if three_pt_pct is not None:
        result["three_pt_pct"] = round(three_pt_pct, 1)

    return result


def scrape_team_season_stats(supabase):
    """Pass 1: Fetch season averages from team detail endpoint."""
    logger.info("Fetching team season stats...")

    result = supabase.table("teams").select("id, espn_id, name").execute()
    teams = result.data

    for team in teams:
        espn_id = team["espn_id"]
        try:
            data = fetch_json(TEAM_URL.format(espn_id))
        except Exception as e:
            logger.warning(f"Failed to fetch stats for {team['name']} ({espn_id}): {e}")
            continue

        team_data = data.get("team", {})
        record_items = team_data.get("record", {}).get("items", [])

        ppg = get_record_stat(record_items, "total", "avgPointsFor")
        opp_ppg = get_record_stat(record_items, "total", "avgPointsAgainst")
        games_played = get_record_stat(record_items, "total", "gamesPlayed")

        # Parse wins-losses from summary if gamesPlayed not available
        if games_played is None:
            for item in record_items:
                if item.get("type") == "total":
                    summary = item.get("summary", "")
                    if "-" in summary:
                        parts = summary.split("-")
                        try:
                            games_played = int(parts[0]) + int(parts[1])
                        except (ValueError, IndexError):
                            pass

        avg_margin = None
        if ppg is not None and opp_ppg is not None:
            avg_margin = round(ppg - opp_ppg, 1)

        row = {
            "team_id": team["id"],
            "season": 2026,
            "ppg": round(ppg, 1) if ppg is not None else None,
            "opp_ppg": round(opp_ppg, 1) if opp_ppg is not None else None,
            "avg_margin": avg_margin,
            "games_played": int(games_played) if games_played else None,
        }

        # Fetch counting stats from ESPN statistics endpoint
        counting = fetch_counting_stats(espn_id)
        row.update(counting)

        # Remove None values so we don't overwrite existing data with nulls
        row = {k: v for k, v in row.items() if v is not None or k in ("team_id", "season")}

        try:
            supabase.table("team_season_stats").upsert(
                row,
                on_conflict="team_id,season",
            ).execute()
            logger.info(f"  {team['name']}: PPG={row.get('ppg')}, OppPPG={row.get('opp_ppg')}, Margin={row.get('avg_margin')}, TO={row.get('avg_turnovers')}, ORB={row.get('avg_off_rebounds')}, FT%={row.get('ft_pct')}")
        except Exception as e:
            logger.error(f"  Failed to upsert stats for {team['name']}: {e}")


def scrape_game_half_scores(supabase):
    """Pass 2: Fetch per-half scores for completed tournament games."""
    logger.info("Fetching game half scores...")

    result = (
        supabase.table("games")
        .select("id, espn_game_id, team1_id, team2_id")
        .eq("is_completed", True)
        .not_.is_("espn_game_id", "null")
        .execute()
    )
    games = result.data

    for game in games:
        espn_game_id = game["espn_game_id"]
        try:
            data = fetch_json(GAME_SUMMARY_URL, params={"event": espn_game_id})
        except Exception as e:
            logger.warning(f"Failed to fetch game summary {espn_game_id}: {e}")
            continue

        header = data.get("header", {})
        competitions = header.get("competitions", [])
        if not competitions:
            continue

        competitors = competitions[0].get("competitors", [])

        for comp in competitors:
            espn_team_id = str(comp.get("id", ""))
            linescores = comp.get("linescores", [])
            if not linescores:
                continue

            # Map ESPN team ID to our team_id
            team_id = None
            if game.get("team1_id"):
                # Look up by espn_id
                t = supabase.table("teams").select("id").eq("espn_id", espn_team_id).execute()
                if t.data:
                    team_id = t.data[0]["id"]

            if not team_id:
                continue

            first_half = int(linescores[0].get("displayValue", 0)) if len(linescores) > 0 else None
            second_half = int(linescores[1].get("displayValue", 0)) if len(linescores) > 1 else None
            ot_pts = sum(
                int(ls.get("displayValue", 0))
                for ls in linescores[2:]
            ) if len(linescores) > 2 else 0

            total = (first_half or 0) + (second_half or 0) + ot_pts

            row = {
                "game_id": game["id"],
                "team_id": team_id,
                "first_half_pts": first_half,
                "second_half_pts": second_half,
                "ot_pts": ot_pts,
                "total_pts": total,
            }

            try:
                supabase.table("game_team_stats").upsert(
                    row,
                    on_conflict="game_id,team_id",
                ).execute()
            except Exception as e:
                logger.error(f"  Failed to upsert game stats {espn_game_id}/{espn_team_id}: {e}")

    logger.info("Game half scores complete.")

    # Compute per-half averages from game data and update team_season_stats
    compute_half_averages(supabase)


def compute_half_averages(supabase):
    """Compute per-half PPG from game_team_stats and update team_season_stats."""
    logger.info("Computing per-half averages from game data...")

    result = supabase.table("teams").select("id, name").execute()
    teams = result.data

    for team in teams:
        team_id = team["id"]
        stats = (
            supabase.table("game_team_stats")
            .select("first_half_pts, second_half_pts")
            .eq("team_id", team_id)
            .execute()
        )

        if not stats.data:
            continue

        games = stats.data
        n = len(games)
        first_half_ppg = round(sum(g["first_half_pts"] or 0 for g in games) / n, 1)
        second_half_ppg = round(sum(g["second_half_pts"] or 0 for g in games) / n, 1)

        try:
            supabase.table("team_season_stats").upsert(
                {
                    "team_id": team_id,
                    "season": 2026,
                    "first_half_ppg": first_half_ppg,
                    "second_half_ppg": second_half_ppg,
                },
                on_conflict="team_id,season",
            ).execute()
            logger.info(f"  {team['name']}: 1H={first_half_ppg}, 2H={second_half_ppg}")
        except Exception as e:
            logger.error(f"  Failed to update half averages for {team['name']}: {e}")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    scrape_team_season_stats(supabase)
    scrape_game_half_scores(supabase)
    logger.info("ESPN box score scrape complete.")


if __name__ == "__main__":
    main()
