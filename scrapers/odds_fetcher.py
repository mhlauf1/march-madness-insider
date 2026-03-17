"""
Betting Odds Fetcher
Pulls game lines and championship futures from The-Odds-API.
Schedule: 3x daily (8AM, 2PM, 8PM ET).
"""

import os
import sys
import logging
import difflib
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]

API_BASE = "https://api.the-odds-api.com/v4"
SPORT = "basketball_ncaab"
TARGET_BOOKMAKERS = {"draftkings", "fanduel", "betmgm", "caesars"}


def implied_prob(american_odds: int) -> float:
    if american_odds > 0:
        return 100 / (american_odds + 100)
    else:
        return abs(american_odds) / (abs(american_odds) + 100)


def normalize_name(name: str) -> str:
    return name.lower().strip().replace(".", "").replace("'", "").replace("-", " ")


def match_team(api_name: str, db_teams: dict) -> str | None:
    normalized = normalize_name(api_name)
    for name, team_id in db_teams.items():
        if normalize_name(name) == normalized:
            return team_id

    matches = difflib.get_close_matches(
        normalized,
        [normalize_name(n) for n in db_teams.keys()],
        n=1,
        cutoff=0.5,
    )
    if matches:
        for name in db_teams:
            if normalize_name(name) == matches[0]:
                return db_teams[name]

    return None


def fetch_game_odds(supabase):
    logger.info("Fetching game odds...")

    # Build lookup of team names -> IDs
    teams_result = supabase.table("teams").select("id, name, full_name").execute()
    db_teams = {}
    for row in teams_result.data:
        db_teams[row["name"]] = row["id"]
        db_teams[row["full_name"]] = row["id"]

    # Build lookup of (team1_id, team2_id) -> game_id for unfinished games
    games_result = supabase.table("games").select("id, team1_id, team2_id").eq("is_completed", False).execute()
    game_lookup = {}
    for g in games_result.data:
        if g["team1_id"] and g["team2_id"]:
            game_lookup[(g["team1_id"], g["team2_id"])] = g["id"]
            game_lookup[(g["team2_id"], g["team1_id"])] = g["id"]

    resp = requests.get(
        f"{API_BASE}/sports/{SPORT}/odds/",
        params={
            "apiKey": ODDS_API_KEY,
            "regions": "us",
            "markets": "h2h,spreads,totals",
            "oddsFormat": "american",
        },
        timeout=30,
    )
    resp.raise_for_status()

    remaining = resp.headers.get("x-requests-remaining", "?")
    logger.info(f"API requests remaining: {remaining}")

    odds_data = resp.json()
    inserted = 0

    for event in odds_data:
        home_team_name = event.get("home_team", "")
        away_team_name = event.get("away_team", "")

        home_id = match_team(home_team_name, db_teams)
        away_id = match_team(away_team_name, db_teams)

        if not home_id or not away_id:
            continue

        game_id = game_lookup.get((home_id, away_id))
        if not game_id:
            continue

        for bookmaker in event.get("bookmakers", []):
            bk_key = bookmaker.get("key", "")
            if bk_key not in TARGET_BOOKMAKERS:
                continue

            odds_row = {
                "game_id": game_id,
                "bookmaker": bk_key,
            }

            for market in bookmaker.get("markets", []):
                market_key = market.get("key", "")
                outcomes = market.get("outcomes", [])

                if market_key == "spreads" and len(outcomes) >= 2:
                    for outcome in outcomes:
                        team_id = match_team(outcome.get("name", ""), db_teams)
                        if team_id == home_id:
                            odds_row["spread_team1"] = outcome.get("point")
                        elif team_id == away_id:
                            odds_row["spread_team2"] = outcome.get("point")

                elif market_key == "h2h" and len(outcomes) >= 2:
                    for outcome in outcomes:
                        team_id = match_team(outcome.get("name", ""), db_teams)
                        if team_id == home_id:
                            odds_row["ml_team1"] = outcome.get("price")
                        elif team_id == away_id:
                            odds_row["ml_team2"] = outcome.get("price")

                elif market_key == "totals" and len(outcomes) >= 2:
                    for outcome in outcomes:
                        if outcome.get("name") == "Over":
                            odds_row["total_over"] = outcome.get("point")
                            odds_row["over_odds"] = outcome.get("price")
                        elif outcome.get("name") == "Under":
                            odds_row["total_under"] = outcome.get("point")
                            odds_row["under_odds"] = outcome.get("price")

            try:
                supabase.table("betting_odds").insert(odds_row).execute()
                inserted += 1
            except Exception as e:
                logger.error(f"Failed to insert odds: {e}")

    logger.info(f"Inserted {inserted} betting odds rows.")


def fetch_futures(supabase):
    logger.info("Fetching championship futures...")

    teams_result = supabase.table("teams").select("id, name, full_name").execute()
    db_teams = {}
    for row in teams_result.data:
        db_teams[row["name"]] = row["id"]
        db_teams[row["full_name"]] = row["id"]

    # Try championship futures - may use a different sport key
    futures_sport = "basketball_ncaab_championship_winner"
    resp = requests.get(
        f"{API_BASE}/sports/{futures_sport}/odds/",
        params={
            "apiKey": ODDS_API_KEY,
            "regions": "us",
            "markets": "outrights",
            "oddsFormat": "american",
        },
        timeout=30,
    )
    if resp.status_code != 200:
        # Fall back to standard sport key
        logger.warning(f"Futures endpoint returned {resp.status_code}, trying standard sport key...")
        resp = requests.get(
            f"{API_BASE}/sports/{SPORT}/odds/",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "us",
                "markets": "outrights",
                "oddsFormat": "american",
            },
            timeout=30,
        )
        if resp.status_code != 200:
            logger.warning(f"Championship futures not available (HTTP {resp.status_code}). Skipping.")
            return

    remaining = resp.headers.get("x-requests-remaining", "?")
    logger.info(f"API requests remaining: {remaining}")

    futures_data = resp.json()
    inserted = 0

    for event in futures_data:
        for bookmaker in event.get("bookmakers", []):
            bk_key = bookmaker.get("key", "")
            if bk_key not in TARGET_BOOKMAKERS:
                continue

            for market in bookmaker.get("markets", []):
                if market.get("key") != "outrights":
                    continue

                for outcome in market.get("outcomes", []):
                    team_name = outcome.get("name", "")
                    odds = outcome.get("price")

                    if odds is None:
                        continue

                    team_id = match_team(team_name, db_teams)
                    if not team_id:
                        continue

                    futures_row = {
                        "team_id": team_id,
                        "bookmaker": bk_key,
                        "odds": int(odds),
                        "implied_prob": round(implied_prob(int(odds)), 4),
                    }

                    try:
                        supabase.table("championship_futures").insert(futures_row).execute()
                        inserted += 1
                    except Exception as e:
                        logger.error(f"Failed to insert future: {e}")

    logger.info(f"Inserted {inserted} championship futures rows.")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    fetch_game_odds(supabase)
    fetch_futures(supabase)


if __name__ == "__main__":
    main()
