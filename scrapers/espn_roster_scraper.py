"""
ESPN Roster Fallback Scraper
Fills in missing player data for teams that KenPom couldn't match.
Uses ESPN's public roster API — no authentication needed.
"""

import os
import logging
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SEASON = 2026

ROSTER_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{espn_id}/roster"

YEAR_MAP = {
    "Freshman": "Fr",
    "Sophomore": "So",
    "Junior": "Jr",
    "Senior": "Sr",
    "Graduate": "Sr",
    "Redshirt Freshman": "Fr",
    "Redshirt Sophomore": "So",
    "Redshirt Junior": "Jr",
    "Redshirt Senior": "Sr",
}


def fetch_json(url: str) -> dict | None:
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return None


MIN_PLAYERS = 5  # Teams with fewer than this are considered incomplete


def get_teams_needing_players(supabase) -> list[dict]:
    """Find tournament teams with missing or insufficient player data (< MIN_PLAYERS)."""
    all_teams = supabase.table("teams").select("id, name, espn_id").execute().data

    existing = supabase.table("kenpom_players").select("team_id, name").execute().data

    # Count players per team
    player_counts: dict[str, int] = {}
    for row in existing:
        tid = row["team_id"]
        player_counts[tid] = player_counts.get(tid, 0) + 1

    needing = []
    for t in all_teams:
        if not t.get("espn_id"):
            continue
        count = player_counts.get(t["id"], 0)
        if count < MIN_PLAYERS:
            needing.append(t)
            logger.debug(f"  {t['name']}: {count} players (needs ESPN backfill)")

    return needing


def normalize_height(h: str) -> str:
    """Convert ESPN height format (6' 8\") to KenPom format (6-8)."""
    import re
    m = re.match(r"""(\d+)['\u2019]\s*(\d+)""", h)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return h


def fetch_roster(espn_id: str) -> list[dict]:
    """Fetch roster from ESPN API and map to kenpom_players schema."""
    data = fetch_json(ROSTER_URL.format(espn_id=espn_id))
    if not data:
        return []

    athletes = data.get("athletes", [])
    players = []

    for athlete in athletes:
        name = athlete.get("displayName", "")
        if not name:
            continue

        # Skip inactive players
        status = athlete.get("status", {}).get("type", "")
        if status == "inactive":
            continue

        position = athlete.get("position", {}).get("abbreviation", "")
        height = normalize_height(athlete.get("displayHeight", ""))
        experience = athlete.get("experience", {}).get("displayValue", "")
        year_class = YEAR_MAP.get(experience, "")

        players.append({
            "name": name,
            "height": height,
            "year_class": year_class,
            "position": position,
            # Stats will be null — frontend handles this with "---"
            "minutes_pct": None,
            "ppg": None,
            "off_rtg": None,
            "usg_pct": None,
            "efg_pct": None,
            "ts_pct": None,
        })

    # Return top 10 (ESPN doesn't have minutes data, so just take first 10)
    return players[:10]


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    needing = get_teams_needing_players(supabase)
    if not needing:
        logger.info("All teams have sufficient player data. Nothing to do.")
        return

    logger.info(f"Found {len(needing)} teams needing player data: {[t['name'] for t in needing]}")

    filled = 0
    still_missing = []

    for team in needing:
        players = fetch_roster(team["espn_id"])
        if not players:
            still_missing.append(team["name"])
            continue

        for p in players:
            p["team_id"] = team["id"]
            p["season"] = SEASON

        try:
            supabase.table("kenpom_players").upsert(
                players, on_conflict="team_id,season,name"
            ).execute()
            filled += 1
            logger.info(f"  Filled {len(players)} players for {team['name']} (ESPN)")
        except Exception as e:
            logger.error(f"  Failed to upsert ESPN roster for {team['name']}: {e}")
            still_missing.append(team["name"])

    logger.info(f"Filled player data for {filled}/{len(needing)} teams via ESPN.")
    if still_missing:
        logger.warning(f"Still missing: {still_missing}")


if __name__ == "__main__":
    main()
