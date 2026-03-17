"""
Travel Distance Calculator
Calculates distances from each team's campus to their game venues.
Run once after bracket is set.
"""

import os
import logging
from dotenv import load_dotenv
from supabase import create_client
from geopy.distance import geodesic

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

VENUES = {
    "Dayton": {"city": "Dayton", "state": "OH", "lat": 39.7589, "lng": -84.1916},
    "Buffalo": {"city": "Buffalo", "state": "NY", "lat": 42.8864, "lng": -78.8784},
    "Greenville": {"city": "Greenville", "state": "SC", "lat": 34.8526, "lng": -82.3940},
    "Oklahoma City": {"city": "Oklahoma City", "state": "OK", "lat": 35.4676, "lng": -97.5164},
    "Portland": {"city": "Portland", "state": "OR", "lat": 45.5051, "lng": -122.6750},
    "Tampa": {"city": "Tampa", "state": "FL", "lat": 27.9506, "lng": -82.4572},
    "Philadelphia": {"city": "Philadelphia", "state": "PA", "lat": 39.9526, "lng": -75.1652},
    "San Diego": {"city": "San Diego", "state": "CA", "lat": 32.7157, "lng": -117.1611},
    "St. Louis": {"city": "St. Louis", "state": "MO", "lat": 38.6270, "lng": -90.1994},
    "Houston": {"city": "Houston", "state": "TX", "lat": 29.7604, "lng": -95.3698},
    "San Jose": {"city": "San Jose", "state": "CA", "lat": 37.3382, "lng": -121.8863},
    "Chicago": {"city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298},
    "Washington DC": {"city": "Washington", "state": "DC", "lat": 38.9072, "lng": -77.0369},
    "Indianapolis": {"city": "Indianapolis", "state": "IN", "lat": 39.7684, "lng": -86.1581},
}

# Approximate timezone offsets by longitude ranges (US mainland)
def estimate_tz_offset(lng: float) -> int:
    if lng > -82:
        return -5  # Eastern
    elif lng > -90:
        return -6  # Central
    elif lng > -105:
        return -7  # Mountain
    else:
        return -8  # Pacific


def calculate_travel(supabase):
    logger.info("Calculating travel distances...")

    # Get all teams with coordinates
    teams_result = supabase.table("teams").select("id, campus_lat, campus_lng, campus_state").execute()
    teams = {t["id"]: t for t in teams_result.data if t["campus_lat"] and t["campus_lng"]}

    # Get first-round and second-round games
    games_result = (
        supabase.table("games")
        .select("id, team1_id, team2_id, venue_city, venue_state, venue_lat, venue_lng")
        .in_("round", [0, 1, 2])
        .execute()
    )

    inserted = 0
    for game in games_result.data:
        venue_city = game.get("venue_city", "")
        venue_lat = game.get("venue_lat")
        venue_lng = game.get("venue_lng")

        # Try to get coordinates from our venue data if not in DB
        if not venue_lat or not venue_lng:
            for venue_name, venue_info in VENUES.items():
                if venue_name.lower() in (venue_city or "").lower():
                    venue_lat = venue_info["lat"]
                    venue_lng = venue_info["lng"]
                    break

        if not venue_lat or not venue_lng:
            continue

        for team_id_key in ["team1_id", "team2_id"]:
            team_id = game.get(team_id_key)
            if not team_id or team_id not in teams:
                continue

            team = teams[team_id]
            campus_coords = (float(team["campus_lat"]), float(team["campus_lng"]))
            venue_coords = (float(venue_lat), float(venue_lng))

            distance = int(geodesic(campus_coords, venue_coords).miles)

            campus_tz = estimate_tz_offset(float(team["campus_lng"]))
            venue_tz = estimate_tz_offset(float(venue_lng))
            tz_changes = abs(campus_tz - venue_tz)

            flight_required = distance > 400
            is_home_state = (team.get("campus_state") or "").upper() == (game.get("venue_state") or "").upper()

            # Generate travel note
            if distance < 100:
                note = f"Short trip — {distance} miles"
            elif distance < 400:
                note = f"Driving distance — {distance} miles"
            else:
                direction = "east" if float(venue_lng) > float(team["campus_lng"]) else "west"
                note = f"{distance:,} miles {direction}"

            travel_row = {
                "team_id": team_id,
                "game_id": game["id"],
                "distance_miles": distance,
                "timezone_changes": tz_changes,
                "flight_required": flight_required,
                "is_home_state": is_home_state,
                "travel_notes": note,
            }

            try:
                supabase.table("team_travel").insert(travel_row).execute()
                inserted += 1
            except Exception as e:
                logger.error(f"Failed to insert travel data: {e}")

    logger.info(f"Inserted {inserted} travel records.")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    calculate_travel(supabase)


if __name__ == "__main__":
    main()
