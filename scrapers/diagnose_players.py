"""
Player Data Diagnostic Tool
Read-only: prints a table showing every DB team, its KenPom match status,
match method, and whether player data exists. No DB writes.

Usage:
    python scrapers/diagnose_players.py
"""

import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client

# Add parent to path so we can import from kenpom_scraper
sys.path.insert(0, os.path.dirname(__file__))
from kenpom_scraper import match_team_name, normalize_name, KENPOM_NAME_ALIASES, SEASON

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get all DB teams
    teams_result = supabase.table("teams").select("id, name, full_name, espn_id").execute()
    db_teams = {row["name"]: row for row in teams_result.data}
    all_names = list(db_teams.keys()) + [r["full_name"] for r in teams_result.data if r.get("full_name")]

    # Get teams with player data
    players_result = supabase.table("kenpom_players").select("team_id").execute()
    teams_with_players = {row["team_id"] for row in players_result.data}

    # Get KenPom team list
    try:
        from kenpompy.utils import login
        from kenpompy.team import get_valid_teams

        kenpom_email = os.environ.get("KENPOM_EMAIL")
        kenpom_password = os.environ.get("KENPOM_PASSWORD")

        if kenpom_email and kenpom_password:
            browser = login(kenpom_email, kenpom_password)
            kp_teams = get_valid_teams(browser)
        else:
            logger.warning("KenPom credentials not set — skipping KenPom match check")
            kp_teams = []
    except ImportError:
        logger.warning("kenpompy not installed — skipping KenPom match check")
        kp_teams = []

    # Build KenPom -> DB match map
    kp_match_map = {}  # db_team_name -> (kp_name, method)
    unmatched_kp = []

    for kp_name in kp_teams:
        method_info = {}
        matched = match_team_name(kp_name, all_names, match_method=method_info)
        if matched:
            # Resolve to the short name key
            db_name = matched if matched in db_teams else None
            if not db_name:
                for name, row in db_teams.items():
                    if row.get("full_name") == matched:
                        db_name = name
                        break
            if db_name:
                kp_match_map[db_name] = (kp_name, method_info.get("method", "unknown"))
        else:
            unmatched_kp.append(kp_name)

    # Print diagnostic table
    print()
    print(f"{'DB Team Name':<30} {'KenPom Match':<30} {'Method':<10} {'Has Players':<12} {'ESPN ID'}")
    print("-" * 120)

    missing_players = []
    missing_kp_match = []

    for name in sorted(db_teams.keys()):
        team = db_teams[name]
        team_id = team["id"]
        espn_id = team.get("espn_id", "")
        has_players = "YES" if team_id in teams_with_players else "NO"

        if name in kp_match_map:
            kp_name, method = kp_match_map[name]
        else:
            kp_name = "MISSING"
            method = "-"
            missing_kp_match.append(name)

        if team_id not in teams_with_players:
            missing_players.append(name)

        print(f"{name:<30} {kp_name:<30} {method:<10} {has_players:<12} {espn_id}")

    # Summary
    print()
    print(f"Total DB teams: {len(db_teams)}")
    print(f"Teams with player data: {len(teams_with_players)}")
    print(f"Teams missing player data: {len(missing_players)}")
    if missing_players:
        print(f"  -> {missing_players}")
    print(f"KenPom teams matched: {len(kp_match_map)}")
    print(f"KenPom teams unmatched (not in DB): {len(unmatched_kp)}")
    if missing_kp_match:
        print(f"DB teams with no KenPom match: {len(missing_kp_match)}")
        print(f"  -> {missing_kp_match}")
    if unmatched_kp:
        print(f"\nUnmatched KenPom names (first 20): {unmatched_kp[:20]}")


if __name__ == "__main__":
    main()
