"""
Historical Data Loader
Loads static seed performance data (since 1985) into the database.
Run once manually, or re-run to refresh.
"""

import os
import logging
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Historical seed win rates since 1985 (through 2025)
# Format: (seed, round, round_name, games_played, wins, win_rate, avg_margin_win, avg_margin_loss)
SEED_DATA = [
    # Seed 1
    (1, 1, "Round of 64", 164, 160, 0.9756, 21.3, -3.8),
    (1, 2, "Round of 32", 160, 122, 0.7625, 13.2, -7.1),
    (1, 3, "Sweet 16", 122, 80, 0.6557, 10.1, -6.8),
    (1, 4, "Elite Eight", 80, 49, 0.6125, 7.4, -6.2),
    (1, 5, "Final Four", 49, 27, 0.5510, 6.8, -5.9),
    (1, 6, "Championship", 27, 16, 0.5926, 7.1, -4.8),
    # Seed 2
    (2, 1, "Round of 64", 164, 152, 0.9268, 17.8, -5.2),
    (2, 2, "Round of 32", 152, 102, 0.6711, 10.8, -6.3),
    (2, 3, "Sweet 16", 102, 55, 0.5392, 8.2, -6.5),
    (2, 4, "Elite Eight", 55, 29, 0.5273, 6.5, -5.8),
    (2, 5, "Final Four", 29, 14, 0.4828, 5.9, -6.1),
    (2, 6, "Championship", 14, 7, 0.5000, 6.2, -5.4),
    # Seed 3
    (3, 1, "Round of 64", 164, 140, 0.8537, 13.4, -6.8),
    (3, 2, "Round of 32", 140, 76, 0.5429, 9.1, -7.2),
    (3, 3, "Sweet 16", 76, 36, 0.4737, 7.8, -6.9),
    (3, 4, "Elite Eight", 36, 16, 0.4444, 6.1, -5.7),
    (3, 5, "Final Four", 16, 7, 0.4375, 5.2, -6.8),
    (3, 6, "Championship", 7, 3, 0.4286, 4.7, -5.1),
    # Seed 4
    (4, 1, "Round of 64", 164, 131, 0.7988, 11.2, -7.4),
    (4, 2, "Round of 32", 131, 64, 0.4885, 8.4, -7.8),
    (4, 3, "Sweet 16", 64, 28, 0.4375, 7.1, -7.2),
    (4, 4, "Elite Eight", 28, 13, 0.4643, 5.8, -6.1),
    (4, 5, "Final Four", 13, 5, 0.3846, 4.9, -7.3),
    (4, 6, "Championship", 5, 2, 0.4000, 3.5, -4.2),
    # Seed 5
    (5, 1, "Round of 64", 164, 106, 0.6463, 7.8, -8.2),
    (5, 2, "Round of 32", 106, 41, 0.3868, 7.1, -8.6),
    (5, 3, "Sweet 16", 41, 16, 0.3902, 6.2, -7.4),
    (5, 4, "Elite Eight", 16, 6, 0.3750, 5.1, -6.8),
    (5, 5, "Final Four", 6, 2, 0.3333, 4.3, -7.1),
    (5, 6, "Championship", 2, 0, 0.0000, None, -6.5),
    # Seed 6
    (6, 1, "Round of 64", 164, 104, 0.6341, 7.2, -8.6),
    (6, 2, "Round of 32", 104, 38, 0.3654, 6.8, -8.9),
    (6, 3, "Sweet 16", 38, 14, 0.3684, 5.9, -7.6),
    (6, 4, "Elite Eight", 14, 5, 0.3571, 5.2, -6.4),
    (6, 5, "Final Four", 5, 2, 0.4000, 4.8, -5.9),
    (6, 6, "Championship", 2, 1, 0.5000, 3.0, -2.0),
    # Seed 7
    (7, 1, "Round of 64", 164, 99, 0.6037, 6.4, -8.9),
    (7, 2, "Round of 32", 99, 32, 0.3232, 6.1, -9.2),
    (7, 3, "Sweet 16", 32, 10, 0.3125, 5.4, -7.8),
    (7, 4, "Elite Eight", 10, 3, 0.3000, 4.6, -6.7),
    (7, 5, "Final Four", 3, 1, 0.3333, 3.0, -7.5),
    (7, 6, "Championship", 1, 0, 0.0000, None, -8.0),
    # Seed 8
    (8, 1, "Round of 64", 164, 84, 0.5122, 4.2, -5.8),
    (8, 2, "Round of 32", 84, 16, 0.1905, 5.1, -12.4),
    (8, 3, "Sweet 16", 16, 5, 0.3125, 4.2, -8.6),
    (8, 4, "Elite Eight", 5, 2, 0.4000, 3.5, -6.2),
    (8, 5, "Final Four", 2, 1, 0.5000, 2.0, -3.0),
    (8, 6, "Championship", 1, 1, 1.0000, 5.0, None),
    # Seed 9
    (9, 1, "Round of 64", 164, 80, 0.4878, 5.8, -4.2),
    (9, 2, "Round of 32", 80, 12, 0.1500, 4.8, -13.1),
    (9, 3, "Sweet 16", 12, 3, 0.2500, 3.6, -9.2),
    (9, 4, "Elite Eight", 3, 0, 0.0000, None, -7.3),
    # Seed 10
    (10, 1, "Round of 64", 164, 65, 0.3963, 5.1, -7.8),
    (10, 2, "Round of 32", 65, 21, 0.3231, 5.8, -9.4),
    (10, 3, "Sweet 16", 21, 7, 0.3333, 4.2, -8.1),
    (10, 4, "Elite Eight", 7, 2, 0.2857, 3.8, -7.4),
    (10, 5, "Final Four", 2, 0, 0.0000, None, -8.5),
    # Seed 11
    (11, 1, "Round of 64", 168, 60, 0.3571, 4.6, -8.4),
    (11, 2, "Round of 32", 60, 25, 0.4167, 5.2, -8.8),
    (11, 3, "Sweet 16", 25, 9, 0.3600, 4.8, -7.6),
    (11, 4, "Elite Eight", 9, 4, 0.4444, 3.2, -6.9),
    (11, 5, "Final Four", 4, 1, 0.2500, 2.0, -9.3),
    (11, 6, "Championship", 1, 0, 0.0000, None, -11.0),
    # Seed 12
    (12, 1, "Round of 64", 164, 58, 0.3537, 4.2, -7.8),
    (12, 2, "Round of 32", 58, 16, 0.2759, 4.6, -10.2),
    (12, 3, "Sweet 16", 16, 3, 0.1875, 3.1, -8.4),
    (12, 4, "Elite Eight", 3, 1, 0.3333, 2.0, -7.5),
    # Seed 13
    (13, 1, "Round of 64", 164, 34, 0.2073, 3.8, -12.6),
    (13, 2, "Round of 32", 34, 4, 0.1176, 3.2, -14.1),
    (13, 3, "Sweet 16", 4, 0, 0.0000, None, -11.5),
    # Seed 14
    (14, 1, "Round of 64", 164, 24, 0.1463, 3.2, -15.4),
    (14, 2, "Round of 32", 24, 3, 0.1250, 2.8, -16.2),
    (14, 3, "Sweet 16", 3, 1, 0.3333, 1.0, -12.0),
    # Seed 15
    (15, 1, "Round of 64", 164, 14, 0.0854, 2.6, -18.2),
    (15, 2, "Round of 32", 14, 2, 0.1429, 2.2, -19.4),
    (15, 3, "Sweet 16", 2, 0, 0.0000, None, -14.5),
    # Seed 16
    (16, 1, "Round of 64", 168, 4, 0.0238, 1.5, -23.8),
    (16, 2, "Round of 32", 4, 0, 0.0000, None, -18.0),
]

# NCAA tournament titles and appearances for common programs
NCAA_HISTORY = {
    "Duke": {"ncaa_titles": 6, "tournament_appearances": 44, "last_title_year": 2022},
    "North Carolina": {"ncaa_titles": 6, "tournament_appearances": 52, "last_title_year": 2017},
    "UCLA": {"ncaa_titles": 11, "tournament_appearances": 50, "last_title_year": 1995},
    "Kentucky": {"ncaa_titles": 8, "tournament_appearances": 60, "last_title_year": 2012},
    "Kansas": {"ncaa_titles": 4, "tournament_appearances": 52, "last_title_year": 2022},
    "Connecticut": {"ncaa_titles": 5, "tournament_appearances": 35, "last_title_year": 2024},
    "UConn": {"ncaa_titles": 5, "tournament_appearances": 35, "last_title_year": 2024},
    "Villanova": {"ncaa_titles": 3, "tournament_appearances": 40, "last_title_year": 2018},
    "Indiana": {"ncaa_titles": 5, "tournament_appearances": 40, "last_title_year": 1987},
    "Michigan State": {"ncaa_titles": 2, "tournament_appearances": 34, "last_title_year": 2000},
    "Michigan": {"ncaa_titles": 1, "tournament_appearances": 27, "last_title_year": 1989},
    "Florida": {"ncaa_titles": 2, "tournament_appearances": 22, "last_title_year": 2007},
    "Arizona": {"ncaa_titles": 1, "tournament_appearances": 35, "last_title_year": 1997},
    "Louisville": {"ncaa_titles": 2, "tournament_appearances": 43, "last_title_year": 2013},
    "Syracuse": {"ncaa_titles": 1, "tournament_appearances": 38, "last_title_year": 2003},
    "Gonzaga": {"ncaa_titles": 0, "tournament_appearances": 25, "last_title_year": None},
    "Virginia": {"ncaa_titles": 1, "tournament_appearances": 24, "last_title_year": 2019},
    "Baylor": {"ncaa_titles": 1, "tournament_appearances": 14, "last_title_year": 2021},
    "Houston": {"ncaa_titles": 0, "tournament_appearances": 23, "last_title_year": None},
    "Purdue": {"ncaa_titles": 0, "tournament_appearances": 31, "last_title_year": None},
    "Tennessee": {"ncaa_titles": 0, "tournament_appearances": 25, "last_title_year": None},
    "Auburn": {"ncaa_titles": 0, "tournament_appearances": 12, "last_title_year": None},
    "Iowa State": {"ncaa_titles": 0, "tournament_appearances": 20, "last_title_year": None},
    "Marquette": {"ncaa_titles": 1, "tournament_appearances": 18, "last_title_year": 1977},
    "Creighton": {"ncaa_titles": 0, "tournament_appearances": 9, "last_title_year": None},
    "Wisconsin": {"ncaa_titles": 0, "tournament_appearances": 20, "last_title_year": None},
    "San Diego State": {"ncaa_titles": 0, "tournament_appearances": 9, "last_title_year": None},
    "Texas": {"ncaa_titles": 0, "tournament_appearances": 37, "last_title_year": None},
    "Alabama": {"ncaa_titles": 0, "tournament_appearances": 13, "last_title_year": None},
    "Arkansas": {"ncaa_titles": 1, "tournament_appearances": 35, "last_title_year": 1994},
    "Ohio State": {"ncaa_titles": 1, "tournament_appearances": 12, "last_title_year": 1960},
}


def load_seed_data(supabase):
    logger.info("Loading historical seed performance data...")

    for seed, round_num, round_name, games, wins, win_rate, margin_win, margin_loss in SEED_DATA:
        row = {
            "seed": seed,
            "round": round_num,
            "round_name": round_name,
            "games_played": games,
            "wins": wins,
            "win_rate": win_rate,
            "avg_margin_win": margin_win,
            "avg_margin_loss": margin_loss,
        }
        try:
            supabase.table("historical_seed_data").upsert(
                row,
                on_conflict="seed,round",
            ).execute()
        except Exception as e:
            logger.error(f"Failed to upsert seed {seed} round {round_num}: {e}")

    logger.info(f"Loaded {len(SEED_DATA)} historical seed records.")


def load_ncaa_history(supabase):
    logger.info("Updating NCAA tournament history for teams...")

    result = supabase.table("teams").select("id, name").execute()
    updated = 0

    for team in result.data:
        history = NCAA_HISTORY.get(team["name"])
        if not history:
            continue

        try:
            supabase.table("teams").update({
                "ncaa_titles": history["ncaa_titles"],
                "tournament_appearances": history["tournament_appearances"],
                "last_title_year": history["last_title_year"],
            }).eq("id", team["id"]).execute()
            updated += 1
        except Exception as e:
            logger.error(f"Failed to update {team['name']}: {e}")

    logger.info(f"Updated NCAA history for {updated} teams.")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    load_seed_data(supabase)
    load_ncaa_history(supabase)


if __name__ == "__main__":
    main()
