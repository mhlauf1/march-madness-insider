"""
ESPN Tournament Bracket Scraper
Pulls bracket structure and game results from ESPN's API.
Schedule: Every 2 hours during tournament (March 17 - April 6).
"""

import os
import re
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

SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard"
BRACKET_URL = "https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/tournament/bracket?season=2026"
TEAM_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{}"

ROUND_MAP = {
    "First Four": 0,
    "Round of 64": 1,
    "1st Round": 1,
    "Round of 32": 2,
    "2nd Round": 2,
    "Sweet 16": 3,
    "Sweet Sixteen": 3,
    "Elite Eight": 4,
    "Elite 8": 4,
    "Final Four": 5,
    "Championship": 6,
    "National Championship": 6,
}

ROUND_NAMES = {v: k for k, v in ROUND_MAP.items()}


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    return slug


def fetch_json(url: str, params: dict | None = None) -> dict:
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_team_details(espn_id: str) -> dict | None:
    try:
        data = fetch_json(TEAM_URL.format(espn_id))
        team = data.get("team", {})
        return team
    except Exception as e:
        logger.warning(f"Failed to fetch team {espn_id}: {e}")
        return None


def parse_team_from_competitor(comp: dict) -> dict:
    team_data = comp.get("team", {})
    espn_id = str(team_data.get("id", ""))
    name = team_data.get("shortDisplayName", team_data.get("displayName", ""))
    full_name = team_data.get("displayName", name)
    abbreviation = team_data.get("abbreviation", "")
    logo_url = f"https://a.espncdn.com/i/teamlogos/ncaa/500/{espn_id}.png"

    seed_raw = comp.get("curatedRank", {}).get("current")
    if seed_raw is None:
        seed_str = comp.get("seed", "0")
        seed = int(seed_str) if seed_str and seed_str.isdigit() else 0
    else:
        seed = int(seed_raw) if seed_raw else 0

    return {
        "espn_id": espn_id,
        "name": name,
        "full_name": full_name,
        "slug": slugify(full_name),
        "abbreviation": abbreviation,
        "logo_url": logo_url,
        "seed": seed,
        "record_wins": 0,
        "record_losses": 0,
    }


def enrich_team(team_row: dict, espn_id: str) -> dict:
    details = fetch_team_details(espn_id)
    if not details:
        return team_row

    team_row["primary_color"] = f"#{details.get('color', '000000')}"
    team_row["secondary_color"] = f"#{details.get('alternateColor', '000000')}"

    location = details.get("location", {})
    if location and isinstance(location, dict):
        team_row["campus_city"] = location.get("city", "")
        team_row["campus_state"] = location.get("state", "")

    # Record from team detail API: team.record.items[0].summary
    record = details.get("record", {})
    items = record.get("items", [])
    if items:
        summary = items[0].get("summary", "")
        if "-" in summary:
            parts = summary.split("-")
            try:
                team_row["record_wins"] = int(parts[0])
                team_row["record_losses"] = int(parts[1])
            except (ValueError, IndexError):
                pass

    # Conference: try standingSummary first (e.g. "1st in ACC"),
    # then groups.name, then groups.parent.shortName
    standing = details.get("standingSummary", "")
    if standing and " in " in standing:
        team_row["conference"] = standing.split(" in ", 1)[1].strip()
    else:
        groups = details.get("groups", {})
        if groups and isinstance(groups, dict):
            conf_name = groups.get("name", "")
            if not conf_name:
                parent = groups.get("parent", {})
                if parent and isinstance(parent, dict):
                    conf_name = parent.get("shortName", "")
            if conf_name:
                team_row["conference"] = conf_name

    # Coach from ESPN API coaches array
    coaches = details.get("coaches", [])
    if coaches and isinstance(coaches, list):
        head_coach = coaches[0]
        first = head_coach.get("firstName", "")
        last = head_coach.get("lastName", "")
        if first or last:
            team_row["coach"] = f"{first} {last}".strip()

    return team_row


def scrape_bracket(supabase):
    logger.info("Fetching bracket data from ESPN...")

    # Fetch bracket structure
    try:
        bracket_data = fetch_json(BRACKET_URL)
    except Exception as e:
        logger.error(f"Failed to fetch bracket: {e}")
        bracket_data = None

    # Fetch all tournament games using date range
    scoreboard = fetch_json(SCOREBOARD_URL, params={
        "groups": "100",
        "limit": "100",
        "dates": "20260317-20260406",
    })
    events = scoreboard.get("events", [])

    teams_seen = {}
    games_to_upsert = []

    for event in events:
        espn_game_id = str(event.get("id", ""))
        competitions = event.get("competitions", [])
        if not competitions:
            continue

        comp = competitions[0]
        competitors = comp.get("competitors", [])
        if len(competitors) < 2:
            continue

        # Parse round info from event name or notes
        season_type = event.get("season", {}).get("slug", "")
        status_obj = comp.get("status", {})
        status_type = status_obj.get("type", {})
        status_name = status_type.get("name", "STATUS_SCHEDULED")

        # Try to get round from event notes
        round_num = 1
        round_name = "Round of 64"
        notes = comp.get("notes", [])
        if notes:
            headline = notes[0].get("headline", "")
            for rname, rnum in ROUND_MAP.items():
                if rname.lower() in headline.lower():
                    round_num = rnum
                    round_name = rname
                    break

        # Parse venue
        venue = comp.get("venue", {})
        venue_name = venue.get("fullName", "")
        venue_address = venue.get("address", {})
        venue_city = venue_address.get("city", "")
        venue_state = venue_address.get("state", "")

        # Determine region from notes headline
        # e.g. "NCAA Men's Basketball Championship - East Region - 1st Round"
        region = None
        if notes:
            headline = notes[0].get("headline", "")
            for r in ["East", "West", "Midwest", "South"]:
                if r in headline:
                    region = r
                    break

        scheduled_at = comp.get("date", event.get("date"))

        # Parse teams
        team1_data = parse_team_from_competitor(competitors[0])
        team2_data = parse_team_from_competitor(competitors[1])

        for td in [team1_data, team2_data]:
            if td["espn_id"] and td["espn_id"] not in teams_seen:
                if not td.get("conference"):
                    td["conference"] = ""
                if not td.get("region"):
                    td["region"] = region or ""
                teams_seen[td["espn_id"]] = td

        # Determine game status
        is_completed = status_name == "STATUS_FINAL"
        status = "final" if is_completed else ("in_progress" if status_name == "STATUS_IN_PROGRESS" else "scheduled")

        team1_score = int(competitors[0].get("score", 0)) if is_completed or status == "in_progress" else None
        team2_score = int(competitors[1].get("score", 0)) if is_completed or status == "in_progress" else None

        game = {
            "espn_game_id": espn_game_id,
            "round": round_num,
            "round_name": round_name,
            "region": region,
            "scheduled_at": scheduled_at,
            "venue_name": venue_name,
            "venue_city": venue_city,
            "venue_state": venue_state,
            "team1_espn_id": team1_data["espn_id"],
            "team2_espn_id": team2_data["espn_id"],
            "team1_score": team1_score,
            "team2_score": team2_score,
            "is_completed": is_completed,
            "status": status,
        }
        games_to_upsert.append(game)

    # Enrich and upsert teams
    logger.info(f"Found {len(teams_seen)} teams. Enriching with details...")
    for espn_id, team_data in teams_seen.items():
        team_data = enrich_team(team_data, espn_id)
        if not team_data.get("region"):
            team_data["region"] = "TBD"
        if not team_data.get("conference"):
            team_data["conference"] = "Unknown"

        upsert_data = {k: v for k, v in team_data.items() if k != "espn_id"}
        upsert_data["espn_id"] = espn_id

        try:
            supabase.table("teams").upsert(
                upsert_data,
                on_conflict="espn_id",
            ).execute()
            logger.info(f"  Upserted team: {team_data['name']}")
        except Exception as e:
            logger.error(f"  Failed to upsert team {team_data['name']}: {e}")

    # Build espn_id -> team UUID lookup
    result = supabase.table("teams").select("id, espn_id").execute()
    espn_to_uuid = {row["espn_id"]: row["id"] for row in result.data}

    # Upsert games
    logger.info(f"Upserting {len(games_to_upsert)} games...")
    for game in games_to_upsert:
        team1_uuid = espn_to_uuid.get(game["team1_espn_id"])
        team2_uuid = espn_to_uuid.get(game["team2_espn_id"])

        # Determine winner and upset
        winner_id = None
        is_upset = False
        if game["is_completed"] and game["team1_score"] is not None and game["team2_score"] is not None:
            if game["team1_score"] > game["team2_score"]:
                winner_id = team1_uuid
            else:
                winner_id = team2_uuid

            # Check for upset
            team1_info = teams_seen.get(game["team1_espn_id"], {})
            team2_info = teams_seen.get(game["team2_espn_id"], {})
            seed1 = team1_info.get("seed", 0)
            seed2 = team2_info.get("seed", 0)
            if seed1 > 0 and seed2 > 0:
                if winner_id == team1_uuid and seed1 > seed2:
                    is_upset = True
                elif winner_id == team2_uuid and seed2 > seed1:
                    is_upset = True

        game_row = {
            "espn_game_id": game["espn_game_id"],
            "round": game["round"],
            "round_name": game["round_name"],
            "region": game["region"],
            "scheduled_at": game["scheduled_at"],
            "venue_name": game["venue_name"],
            "venue_city": game["venue_city"],
            "venue_state": game["venue_state"],
            "team1_id": team1_uuid,
            "team2_id": team2_uuid,
            "team1_score": game["team1_score"],
            "team2_score": game["team2_score"],
            "winner_id": winner_id,
            "is_completed": game["is_completed"],
            "is_upset": is_upset,
            "status": game["status"],
        }

        try:
            supabase.table("games").upsert(
                game_row,
                on_conflict="espn_game_id",
            ).execute()
        except Exception as e:
            logger.error(f"  Failed to upsert game {game['espn_game_id']}: {e}")

    logger.info("ESPN scrape complete.")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    scrape_bracket(supabase)


if __name__ == "__main__":
    main()
