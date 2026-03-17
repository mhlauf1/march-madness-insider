"""
KenPom Analytics Scraper
Pulls ratings, four factors, player stats, and program history.
Schedule: Daily at 6:00 AM ET.
"""

import os
import sys
import logging
import difflib
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
KENPOM_EMAIL = os.environ["KENPOM_EMAIL"]
KENPOM_PASSWORD = os.environ["KENPOM_PASSWORD"]

SEASON = 2026

# KenPom name -> DB name for teams that can't be fuzzy-matched
KENPOM_NAME_ALIASES = {
    "Connecticut": "UConn",
}

# KenPom uses abbreviated conference names; map them to the full names used by ESPN
KENPOM_CONF_MAP = {
    "B12": "Big 12",
    "B10": "Big Ten",
    "BE": "Big East",
    "P12": "Pac-12",
    "ACC": "ACC",
    "SEC": "SEC",
    "Amer": "American Athletic Conference",
    "A10": "Atlantic 10",
    "MWC": "Mountain West",
    "WCC": "West Coast Conference",
    "MVC": "Missouri Valley",
    "CUSA": "Conference USA",
    "MAC": "Mid-American",
    "SB": "Sun Belt",
    "SC": "Southern",
    "CAA": "Colonial Athletic Association",
    "Ivy": "Ivy League",
    "Horz": "Horizon League",
    "WAC": "Western Athletic Conference",
    "OVC": "Ohio Valley",
    "AE": "America East",
    "ASun": "Atlantic Sun",
    "BSky": "Big Sky",
    "BSth": "Big South",
    "BW": "Big West",
    "Ind": "Independent",
    "MAAC": "Metro Atlantic Athletic",
    "NEC": "Northeast",
    "Pat": "Patriot League",
    "Slnd": "Southland",
    "Sum": "Summit League",
    "SWAC": "Southwestern Athletic",
    "MEAC": "Mid-Eastern Athletic",
}


def normalize_name(name: str) -> str:
    return name.lower().strip().replace(".", "").replace("'", "").replace("-", " ").replace("st.", "st")


def match_team_name(kenpom_name: str, team_names: list[str]) -> str | None:
    # Check alias map first
    alias = KENPOM_NAME_ALIASES.get(kenpom_name)
    if alias and alias in team_names:
        return alias

    normalized = normalize_name(kenpom_name)
    for tn in team_names:
        if normalize_name(tn) == normalized:
            return tn

    matches = difflib.get_close_matches(normalized, [normalize_name(t) for t in team_names], n=1, cutoff=0.85)
    if matches:
        for tn in team_names:
            if normalize_name(tn) == matches[0]:
                return tn

    return None


def scrape_ratings(supabase):
    try:
        from kenpompy.utils import login
        from kenpompy.misc import get_pomeroy_ratings
        from kenpompy.summary import get_fourfactors, get_pointdist
    except ImportError:
        logger.error("kenpompy not installed. Run: pip install kenpompy")
        sys.exit(1)

    logger.info("Logging into KenPom...")
    browser = login(KENPOM_EMAIL, KENPOM_PASSWORD)

    # Get all tournament teams from DB
    result = supabase.table("teams").select("id, name, full_name").execute()
    db_teams = {row["name"]: row["id"] for row in result.data}
    db_teams_full = {row["full_name"]: row["id"] for row in result.data}
    all_names = list(db_teams.keys()) + list(db_teams_full.keys())

    # Fetch main ratings
    logger.info("Fetching Pomeroy ratings...")
    ratings_df = get_pomeroy_ratings(browser)

    # Fetch four factors (offense + defense in one call)
    logger.info("Fetching four factors...")
    try:
        fourfactors_df = get_fourfactors(browser)
    except Exception as e:
        logger.warning(f"Could not fetch four factors: {e}")
        fourfactors_df = None

    # Fetch points distribution (with retries)
    logger.info("Fetching points distribution...")
    pointdist = None
    for attempt in range(3):
        try:
            pointdist = get_pointdist(browser)
            if pointdist is not None and len(pointdist) > 0:
                break
        except Exception as e:
            logger.warning(f"Point distribution attempt {attempt + 1} failed: {e}")
    if pointdist is None:
        logger.error("All point distribution attempts failed - pct_3pt will be null")

    upserted = 0
    matched_ids = set()  # prevent later fuzzy matches from overwriting earlier exact matches
    for _, row in ratings_df.iterrows():
        kp_name = str(row.get("Team", ""))
        matched = match_team_name(kp_name, all_names)
        if not matched:
            continue

        team_id = db_teams.get(matched) or db_teams_full.get(matched)
        if not team_id:
            continue

        # Skip if this team_id was already matched by a previous KenPom team
        if team_id in matched_ids:
            logger.debug(f"Skipping duplicate match: '{kp_name}' -> team_id={team_id} (already matched)")
            continue
        matched_ids.add(team_id)

        # Get conference from KenPom Conf column
        conf = str(row.get("Conf", "")).strip()

        rating_data = {
            "team_id": team_id,
            "season": SEASON,
            "kenpom_rank": _safe_int(row.get("Rk")),
            "adj_em": _safe_float(row.get("AdjEM")),
            "adj_o": _safe_float(row.get("AdjO")),
            "adj_o_rank": _safe_int(row.get("AdjO.Rank")),
            "adj_d": _safe_float(row.get("AdjD")),
            "adj_d_rank": _safe_int(row.get("AdjD.Rank")),
            "adj_t": _safe_float(row.get("AdjT")),
            "adj_t_rank": _safe_int(row.get("AdjT.Rank")),
            "luck": _safe_float(row.get("Luck")),
            "luck_rank": _safe_int(row.get("Luck.Rank")),
            "sos_adj_em": _safe_float(row.get("SOS-AdjEM")),
            "sos_adj_em_rank": _safe_int(row.get("SOS-AdjEM.Rank")),
        }

        # Four factors from get_fourfactors() — single DataFrame with Off-/Def- prefixed columns
        if fourfactors_df is not None:
            ff_row = _find_team_row(fourfactors_df, kp_name)
            if ff_row is not None:
                # KenPom returns four factors as percentages (e.g. 55.4),
                # convert to decimal (0.554) to match frontend formatPct() logic
                _off_efg = _safe_float(ff_row.get("Off-eFG%"))
                _off_to = _safe_float(ff_row.get("Off-TO%"))
                _off_or = _safe_float(ff_row.get("Off-OR%"))
                _off_ftr = _safe_float(ff_row.get("Off-FTRate"))
                _def_efg = _safe_float(ff_row.get("Def-eFG%"))
                _def_to = _safe_float(ff_row.get("Def-TO%"))
                _def_or = _safe_float(ff_row.get("Def-OR%"))
                _def_ftr = _safe_float(ff_row.get("Def-FTRate"))
                rating_data["off_efg_pct"] = round(_off_efg / 100, 4) if _off_efg is not None else None
                rating_data["off_to_pct"] = round(_off_to / 100, 4) if _off_to is not None else None
                rating_data["off_or_pct"] = round(_off_or / 100, 4) if _off_or is not None else None
                rating_data["off_ftr"] = round(_off_ftr / 100, 4) if _off_ftr is not None else None
                rating_data["def_efg_pct"] = round(_def_efg / 100, 4) if _def_efg is not None else None
                rating_data["def_to_pct"] = round(_def_to / 100, 4) if _def_to is not None else None
                rating_data["def_or_pct"] = round(_def_or / 100, 4) if _def_or is not None else None
                rating_data["def_ftr"] = round(_def_ftr / 100, 4) if _def_ftr is not None else None

        if pointdist is not None:
            pd_row = _find_team_row(pointdist, kp_name)
            if pd_row is not None:
                raw_2pt = _safe_float(pd_row.get("Off-2P", pd_row.get("FG")))
                raw_3pt = _safe_float(pd_row.get("Off-3P", pd_row.get("3P")))
                raw_ft = _safe_float(pd_row.get("Off-FT", pd_row.get("FT")))
                # KenPom returns point distribution as percentages (e.g. 33.2),
                # convert to decimal (0.332) to match D1 averages and frontend logic
                rating_data["pct_2pt"] = round(raw_2pt / 100, 4) if raw_2pt is not None else None
                rating_data["pct_3pt"] = round(raw_3pt / 100, 4) if raw_3pt is not None else None
                rating_data["pct_ft"] = round(raw_ft / 100, 4) if raw_ft is not None else None

        try:
            supabase.table("kenpom_ratings").upsert(
                rating_data,
                on_conflict="team_id,season",
            ).execute()
            upserted += 1
        except Exception as e:
            logger.error(f"Failed to upsert ratings for {kp_name}: {e}")

        # Update team conference from KenPom data (normalize abbreviations)
        if conf:
            conf_full = KENPOM_CONF_MAP.get(conf, conf)
            try:
                supabase.table("teams").update({"conference": conf_full}).eq("id", team_id).execute()
            except Exception:
                pass

    logger.info(f"Upserted {upserted} team ratings.")


def _parse_made(made_attempted: str) -> int | None:
    """Extract the 'made' count from a 'M-A' string like '189-244'."""
    try:
        return int(made_attempted.split("-")[0])
    except (ValueError, IndexError):
        return None


def _parse_team_players(html: str) -> list[dict]:
    """Parse player stats from a KenPom team page HTML."""
    import re
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    if len(tables) < 3:
        return []

    player_table = tables[2]
    players = []

    for row in player_table.find_all("tr")[1:]:
        cells = row.find_all(["th", "td"])
        if len(cells) < 13:
            continue  # skip tier header rows

        # Strip rank spans before extracting text
        for cell in cells:
            for span in cell.find_all("span", class_="plrank"):
                span.decompose()
            for span in cell.find_all("span", class_="kpoy"):
                span.decompose()

        name_tag = cells[1].find("a")
        name = name_tag.get_text(strip=True) if name_tag else cells[1].get_text(strip=True)
        if not name:
            continue

        min_pct = _safe_float(cells[7].get_text(strip=True))
        games = _safe_float(cells[5].get_text(strip=True))

        # Compute PPG from made field goals and free throws
        # Columns: [22] FTM-A, [24] 2PM-A, [26] 3PM-A
        ppg = None
        if games and games > 0 and len(cells) >= 27:
            ftm = _parse_made(cells[22].get_text(strip=True))
            twos = _parse_made(cells[24].get_text(strip=True))
            threes = _parse_made(cells[26].get_text(strip=True))
            if ftm is not None and twos is not None and threes is not None:
                ppg = round((twos * 2 + threes * 3 + ftm) / games, 1)

        players.append({
            "name": name,
            "height": cells[2].get_text(strip=True),
            "year_class": cells[4].get_text(strip=True),
            "minutes_pct": min_pct,
            "ppg": ppg,
            "off_rtg": _safe_float(cells[8].get_text(strip=True)),
            "usg_pct": _safe_float(cells[9].get_text(strip=True)),
            "efg_pct": _safe_float(cells[11].get_text(strip=True)),
            "ts_pct": _safe_float(cells[12].get_text(strip=True)),
        })

    return players


def scrape_players(supabase):
    from kenpompy.utils import login
    from kenpompy.team import get_valid_teams
    import time

    browser = login(KENPOM_EMAIL, KENPOM_PASSWORD)

    result = supabase.table("teams").select("id, name, full_name").execute()
    db_teams = {row["name"]: row["id"] for row in result.data}
    db_teams_full = {row["full_name"]: row["id"] for row in result.data}
    all_names = list(db_teams.keys()) + list(db_teams_full.keys())

    kp_teams = get_valid_teams(browser)
    updated = 0

    for kp_name in kp_teams:
        matched = match_team_name(kp_name, all_names)
        if not matched:
            continue
        team_id = db_teams.get(matched) or db_teams_full.get(matched)
        if not team_id:
            continue

        try:
            resp = browser.get(
                f"https://kenpom.com/team.php?team={kp_name.replace(' ', '+')}"
            )
            players = _parse_team_players(resp.text)
        except Exception as e:
            logger.warning(f"Failed to fetch players for {kp_name}: {e}")
            continue

        if not players:
            continue

        # Top 10 by minutes
        for p in players[:10]:
            p["team_id"] = team_id
            p["season"] = SEASON

        supabase.table("kenpom_players").upsert(
            players[:10], on_conflict="team_id,season,name"
        ).execute()
        updated += 1

        time.sleep(0.5)  # rate-limit requests

    logger.info(f"Updated players for {updated} teams.")


def scrape_program_history(supabase):
    from kenpompy.utils import login
    from kenpompy.misc import get_program_ratings

    browser = login(KENPOM_EMAIL, KENPOM_PASSWORD)

    result = supabase.table("teams").select("id, name, full_name").execute()
    db_teams = {row["name"]: row["id"] for row in result.data}
    db_teams_full = {row["full_name"]: row["id"] for row in result.data}
    all_names = list(db_teams.keys()) + list(db_teams_full.keys())

    logger.info("Fetching program ratings...")
    try:
        import pandas as pd
        program_result = get_program_ratings(browser)
        if isinstance(program_result, list):
            program_df = pd.concat(program_result, ignore_index=True) if program_result else pd.DataFrame()
        else:
            program_df = program_result
    except Exception as e:
        logger.error(f"Failed to fetch program ratings: {e}")
        return

    upserted = 0
    for _, row in program_df.iterrows():
        kp_name = str(row.get("Team", ""))
        matched = match_team_name(kp_name, all_names)
        if not matched:
            continue
        team_id = db_teams.get(matched) or db_teams_full.get(matched)
        if not team_id:
            continue

        for year_offset in range(10):
            season = SEASON - year_offset
            col_prefix = str(season) if str(season) in str(program_df.columns) else None
            if not col_prefix:
                continue

            history_data = {
                "team_id": team_id,
                "season": season,
                "kenpom_rank": _safe_int(row.get(f"{season} Rank", row.get(col_prefix))),
                "adj_em": _safe_float(row.get(f"{season} AdjEM")),
            }

            try:
                supabase.table("kenpom_program_history").upsert(
                    history_data,
                    on_conflict="team_id,season",
                ).execute()
                upserted += 1
            except Exception:
                pass

    logger.info(f"Upserted {upserted} program history records.")


def _find_team_row(df, team_name: str):
    normalized = normalize_name(team_name)
    for _, row in df.iterrows():
        if normalize_name(str(row.get("Team", ""))) == normalized:
            return row
    return None


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    scrape_ratings(supabase)
    scrape_players(supabase)
    scrape_program_history(supabase)


if __name__ == "__main__":
    main()
