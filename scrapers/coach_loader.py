"""
Coach Experience Data Loader
Loads coach tenure, tournament appearances, and first-year status into the database.
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

# Coach data keyed by team name (matching teams.name)
# tenure_years = years as head coach at this school
# tournament_apps = NCAA tournament appearances as a head coach (any school)
# is_first_year = first year as head coach at this school
COACH_DATA = {
    "Duke": {"coach": "Jon Scheyer", "coach_tenure_years": 4, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "North Carolina": {"coach": "Hubert Davis", "coach_tenure_years": 5, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Kansas": {"coach": "Bill Self", "coach_tenure_years": 23, "coach_tournament_apps": 21, "coach_is_first_year": False},
    "Houston": {"coach": "Kelvin Sampson", "coach_tenure_years": 12, "coach_tournament_apps": 10, "coach_is_first_year": False},
    "Auburn": {"coach": "Bruce Pearl", "coach_tenure_years": 12, "coach_tournament_apps": 7, "coach_is_first_year": False},
    "Tennessee": {"coach": "Rick Barnes", "coach_tenure_years": 11, "coach_tournament_apps": 12, "coach_is_first_year": False},
    "Purdue": {"coach": "Matt Painter", "coach_tenure_years": 21, "coach_tournament_apps": 13, "coach_is_first_year": False},
    "Florida": {"coach": "Todd Golden", "coach_tenure_years": 4, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Gonzaga": {"coach": "Mark Few", "coach_tenure_years": 27, "coach_tournament_apps": 25, "coach_is_first_year": False},
    "Alabama": {"coach": "Nate Oats", "coach_tenure_years": 7, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Iowa State": {"coach": "T.J. Otzelberger", "coach_tenure_years": 5, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Marquette": {"coach": "Shaka Smart", "coach_tenure_years": 5, "coach_tournament_apps": 7, "coach_is_first_year": False},
    "Michigan State": {"coach": "Tom Izzo", "coach_tenure_years": 31, "coach_tournament_apps": 26, "coach_is_first_year": False},
    "Michigan St": {"coach": "Tom Izzo", "coach_tenure_years": 31, "coach_tournament_apps": 26, "coach_is_first_year": False},
    "Kentucky": {"coach": "Mark Pope", "coach_tenure_years": 2, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Arizona": {"coach": "Tommy Lloyd", "coach_tenure_years": 5, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Wisconsin": {"coach": "Greg Gard", "coach_tenure_years": 11, "coach_tournament_apps": 7, "coach_is_first_year": False},
    "Baylor": {"coach": "Scott Drew", "coach_tenure_years": 23, "coach_tournament_apps": 13, "coach_is_first_year": False},
    "St. John's": {"coach": "Rick Pitino", "coach_tenure_years": 3, "coach_tournament_apps": 15, "coach_is_first_year": False},
    "Texas A&M": {"coach": "Buzz Williams", "coach_tenure_years": 7, "coach_tournament_apps": 7, "coach_is_first_year": False},
    "Clemson": {"coach": "Brad Brownell", "coach_tenure_years": 16, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Oregon": {"coach": "Dana Altman", "coach_tenure_years": 16, "coach_tournament_apps": 10, "coach_is_first_year": False},
    "Memphis": {"coach": "Penny Hardaway", "coach_tenure_years": 8, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Connecticut": {"coach": "Dan Hurley", "coach_tenure_years": 8, "coach_tournament_apps": 5, "coach_is_first_year": False},
    "UConn": {"coach": "Dan Hurley", "coach_tenure_years": 8, "coach_tournament_apps": 5, "coach_is_first_year": False},
    "UCLA": {"coach": "Mick Cronin", "coach_tenure_years": 7, "coach_tournament_apps": 8, "coach_is_first_year": False},
    "Michigan": {"coach": "Dusty May", "coach_tenure_years": 2, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Texas": {"coach": "Rodney Terry", "coach_tenure_years": 3, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Illinois": {"coach": "Brad Underwood", "coach_tenure_years": 9, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Creighton": {"coach": "Greg McDermott", "coach_tenure_years": 16, "coach_tournament_apps": 8, "coach_is_first_year": False},
    "Louisville": {"coach": "Pat Kelsey", "coach_tenure_years": 2, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "San Diego State": {"coach": "Brian Dutcher", "coach_tenure_years": 9, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "BYU": {"coach": "Kevin Young", "coach_tenure_years": 2, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Missouri": {"coach": "Dennis Gates", "coach_tenure_years": 4, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Pittsburgh": {"coach": "Jeff Capel", "coach_tenure_years": 8, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Mississippi State": {"coach": "Chris Jans", "coach_tenure_years": 4, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Ole Miss": {"coach": "Chris Beard", "coach_tenure_years": 2, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Xavier": {"coach": "Sean Miller", "coach_tenure_years": 2, "coach_tournament_apps": 10, "coach_is_first_year": False},
    "Maryland": {"coach": "Kevin Willard", "coach_tenure_years": 4, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Colorado State": {"coach": "Niko Medved", "coach_tenure_years": 8, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "VCU": {"coach": "Ryan Odom", "coach_tenure_years": 3, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Drake": {"coach": "Darian DeVries", "coach_tenure_years": 1, "coach_tournament_apps": 0, "coach_is_first_year": True},
    "New Mexico": {"coach": "Richard Pitino", "coach_tenure_years": 4, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Vanderbilt": {"coach": "Mark Byington", "coach_tenure_years": 2, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Arkansas": {"coach": "John Calipari", "coach_tenure_years": 2, "coach_tournament_apps": 16, "coach_is_first_year": False},
    "McNeese": {"coach": "Will Wade", "coach_tenure_years": 3, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "UC San Diego": {"coach": "Eric Olen", "coach_tenure_years": 3, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Lipscomb": {"coach": "Lennie Acuff", "coach_tenure_years": 6, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "High Point": {"coach": "Tubby Smith", "coach_tenure_years": 7, "coach_tournament_apps": 10, "coach_is_first_year": False},
    "Grand Canyon": {"coach": "Bryce Drew", "coach_tenure_years": 5, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Troy": {"coach": "Scott Cross", "coach_tenure_years": 4, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Akron": {"coach": "John Groce", "coach_tenure_years": 8, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Wofford": {"coach": "Jay McAuley", "coach_tenure_years": 4, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Yale": {"coach": "James Jones", "coach_tenure_years": 25, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Robert Morris": {"coach": "Andrew Toole", "coach_tenure_years": 13, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Montana": {"coach": "Travis DeCuire", "coach_tenure_years": 12, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Norfolk State": {"coach": "Robert Jones", "coach_tenure_years": 9, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Omaha": {"coach": "Chris Crutchfield", "coach_tenure_years": 4, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "SIU Edwardsville": {"coach": "Brian Barone", "coach_tenure_years": 7, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Bryant": {"coach": "Chris Burns", "coach_tenure_years": 2, "coach_tournament_apps": 0, "coach_is_first_year": False},
    "Texas Tech": {"coach": "Grant McCasland", "coach_tenure_years": 2, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Indiana": {"coach": "Mike Woodson", "coach_tenure_years": 5, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Syracuse": {"coach": "Adrian Autry", "coach_tenure_years": 3, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Villanova": {"coach": "Kyle Neptune", "coach_tenure_years": 4, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Virginia": {"coach": "Tony Bennett", "coach_tenure_years": 17, "coach_tournament_apps": 10, "coach_is_first_year": False},
    "Nevada": {"coach": "Steve Alford", "coach_tenure_years": 5, "coach_tournament_apps": 7, "coach_is_first_year": False},
    "Colorado": {"coach": "Tad Boyle", "coach_tenure_years": 16, "coach_tournament_apps": 5, "coach_is_first_year": False},
    "North Carolina State": {"coach": "Kevin Keatts", "coach_tenure_years": 9, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "NC State": {"coach": "Kevin Keatts", "coach_tenure_years": 9, "coach_tournament_apps": 2, "coach_is_first_year": False},
    # ESPN short-name variants
    "St John's": {"coach": "Rick Pitino", "coach_tenure_years": 3, "coach_tournament_apps": 15, "coach_is_first_year": False},
    "Saint Mary's": {"coach": "Randy Bennett", "coach_tenure_years": 24, "coach_tournament_apps": 9, "coach_is_first_year": False},
    "SMU": {"coach": "Andy Enfield", "coach_tenure_years": 4, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "UCF": {"coach": "Johnny Dawkins", "coach_tenure_years": 8, "coach_tournament_apps": 2, "coach_is_first_year": False},
    "Georgia": {"coach": "Mike White", "coach_tenure_years": 4, "coach_tournament_apps": 3, "coach_is_first_year": False},
    "Iowa": {"coach": "Fran McCaffery", "coach_tenure_years": 16, "coach_tournament_apps": 6, "coach_is_first_year": False},
    "Nebraska": {"coach": "Fred Hoiberg", "coach_tenure_years": 7, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Ohio State": {"coach": "Jake Diebler", "coach_tenure_years": 2, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Miami": {"coach": "Jim Larranaga", "coach_tenure_years": 14, "coach_tournament_apps": 9, "coach_is_first_year": False},
    "TCU": {"coach": "Jamie Dixon", "coach_tenure_years": 8, "coach_tournament_apps": 8, "coach_is_first_year": False},
    "Furman": {"coach": "Bob Richey", "coach_tenure_years": 8, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Utah State": {"coach": "Jerrod Calhoun", "coach_tenure_years": 3, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Saint Louis": {"coach": "Josh Schertz", "coach_tenure_years": 2, "coach_tournament_apps": 0, "coach_is_first_year": False},
    "Santa Clara": {"coach": "Herb Sendek", "coach_tenure_years": 9, "coach_tournament_apps": 4, "coach_is_first_year": False},
    "Hofstra": {"coach": "Speedy Claxton", "coach_tenure_years": 4, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Kennesaw St": {"coach": "Amir Abdur-Rahim", "coach_tenure_years": 5, "coach_tournament_apps": 1, "coach_is_first_year": False},
    "Northern Iowa": {"coach": "Ben Jacobson", "coach_tenure_years": 20, "coach_tournament_apps": 5, "coach_is_first_year": False},
}


def load_coach_data(supabase):
    logger.info("Loading coach experience data...")

    result = supabase.table("teams").select("id, name, coach").execute()
    updated = 0

    for team in result.data:
        data = COACH_DATA.get(team["name"])
        if not data:
            continue

        update_fields = {
            "coach_tenure_years": data["coach_tenure_years"],
            "coach_tournament_apps": data["coach_tournament_apps"],
            "coach_is_first_year": data["coach_is_first_year"],
        }

        # Only set coach if DB value is currently null (ESPN data takes precedence)
        if not team.get("coach"):
            update_fields["coach"] = data["coach"]

        try:
            supabase.table("teams").update(update_fields).eq("id", team["id"]).execute()
            updated += 1
        except Exception as e:
            logger.error(f"Failed to update coach data for {team['name']}: {e}")

    logger.info(f"Updated coach data for {updated} teams.")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    load_coach_data(supabase)


if __name__ == "__main__":
    main()
