"""
Generates data/songs.json — a static, illustrative song catalogue used in place
of the Spotify Web API. Every track is fictional (except the public-domain
classical pieces, which are real compositions used only as factual metadata)
so that no real artist's catalogue is misrepresented with invented audio
features. Swap this file for a live Spotify import once API keys are available
— the schema (energy, tempo, danceability, valence, acousticness,
instrumentalness) mirrors Spotify's Audio Features object on purpose.
"""
import json
import random

random.seed(42)

GENRE_PROFILES = {
    "lofi":      dict(energy=(0.18, 0.40), tempo=(68, 90),  dance=(0.40, 0.62), valence=(0.30, 0.58), acoustic=(0.45, 0.80), instr=(0.70, 0.96)),
    "jazz":      dict(energy=(0.28, 0.52), tempo=(86, 132), dance=(0.40, 0.62), valence=(0.40, 0.70), acoustic=(0.40, 0.72), instr=(0.45, 0.82)),
    "classical": dict(energy=(0.16, 0.40), tempo=(58, 112), dance=(0.18, 0.38), valence=(0.28, 0.60), acoustic=(0.85, 0.99), instr=(0.92, 0.99)),
    "ambient":   dict(energy=(0.08, 0.24), tempo=(48, 70),  dance=(0.10, 0.30), valence=(0.28, 0.50), acoustic=(0.55, 0.88), instr=(0.85, 0.99)),
    "synth":     dict(energy=(0.50, 0.82), tempo=(98, 130), dance=(0.58, 0.86), valence=(0.40, 0.72), acoustic=(0.02, 0.18), instr=(0.55, 0.92)),
    "acoustic":  dict(energy=(0.28, 0.50), tempo=(78, 112), dance=(0.38, 0.60), valence=(0.48, 0.76), acoustic=(0.68, 0.96), instr=(0.08, 0.40)),
    "indie":     dict(energy=(0.38, 0.62), tempo=(88, 122), dance=(0.48, 0.66), valence=(0.42, 0.70), acoustic=(0.28, 0.58), instr=(0.04, 0.28)),
    "citypop":   dict(energy=(0.52, 0.76), tempo=(98, 120), dance=(0.62, 0.82), valence=(0.58, 0.86), acoustic=(0.08, 0.28), instr=(0.04, 0.22)),
    "piano":     dict(energy=(0.12, 0.34), tempo=(52, 92),  dance=(0.18, 0.38), valence=(0.32, 0.58), acoustic=(0.88, 0.99), instr=(0.95, 0.99)),
}

ARTISTS = {
    "lofi": ["Wilted Paper", "Soft Static", "Quiet Antenna", "Paper Lantern Tapes", "Hallway Echo", "Slow Window", "Tape & Tide", "Drift Index"],
    "jazz": ["The Smoky Room Quartet", "Velvet Brass Trio", "Late Hour Ensemble", "Brushed Drum Society", "Low Light Sessions", "The Corner Booth Band"],
    "classical": ["Claude Debussy", "Ludwig van Beethoven", "Erik Satie", "Frédéric Chopin", "Edvard Grieg", "Antonio Vivaldi"],
    "ambient": ["Pale Horizon", "Glacier Hum", "Still Water Index", "Faint Atlas", "Slow Tide Collective", "Hollow Orbit"],
    "synth": ["Neon Atlas", "Night Circuit", "Vapor Grid", "Violet Frequency", "Glasswave", "Echo District"],
    "acoustic": ["Maple & Moss", "Open Field Sessions", "Wren and Pine", "Porchlight Folk", "Quiet Acre", "Barefoot Season"],
    "indie": ["Sundial Youth", "Paper Boats", "Slow Bloom", "Faded Polaroid", "Marigold Static", "The Quiet Parade"],
    "citypop": ["Midnight Skyline", "Plastic Love Radio", "Tokyo Drive Club", "Neon Avenue", "Glass Tower Sessions", "Velocity Lounge"],
    "piano": ["Ines Calder", "Hugo Renvik", "Mira Aoki", "Soren Vale", "Anya Ferro", "Liam Oakhurst"],
}

TITLE_WORDS_A = ["Window", "Quiet", "Slow", "Paper", "Faded", "Soft", "Late", "Hollow", "Drifting", "Warm", "Distant", "Gentle", "Lonely", "Still", "Fading", "Velvet", "Amber", "Pale", "Folded", "Open"]
TITLE_WORDS_B = ["Light", "Rain", "Hour", "Static", "Letter", "Train", "Tide", "Room", "Streets", "Morning", "Evening", "Static", "Heart", "Echo", "Sky", "Field", "Harbor", "Lantern", "Bloom", "Sleep"]

CLASSICAL_REAL_TITLES = [
    "Clair de Lune", "Moonlight Sonata, 1st Movement", "Gymnopédie No. 1",
    "Nocturne in E-flat Major, Op. 9 No. 2", "Arietta", "Spring, 1st Movement",
    "Gymnopédie No. 3", "Für Elise", "Nocturne No. 20 in C-sharp Minor", "Reverie",
]

def make_title(seen, genre, idx):
    if genre == "classical":
        return CLASSICAL_REAL_TITLES[idx % len(CLASSICAL_REAL_TITLES)]
    while True:
        t = f"{random.choice(TITLE_WORDS_A)} {random.choice(TITLE_WORDS_B)}"
        if t not in seen:
            seen.add(t)
            return t

def rnd(a, b):
    return round(random.uniform(a, b), 2)

songs = []
sid = 1
for genre, profile in GENRE_PROFILES.items():
    seen_titles = set()
    artists = ARTISTS[genre]
    n = 10
    for i in range(n):
        artist = artists[i % len(artists)]
        title = make_title(seen_titles, genre, i)
        songs.append({
            "id": f"song_{sid:03d}",
            "title": title,
            "artist": artist,
            "genre": genre,
            "energy": rnd(*profile["energy"]),
            "tempo": round(random.uniform(*profile["tempo"])),
            "danceability": rnd(*profile["dance"]),
            "valence": rnd(*profile["valence"]),
            "acousticness": rnd(*profile["acoustic"]),
            "instrumentalness": rnd(*profile["instr"]),
            "durationSec": random.randint(120, 270),
            "coverPalette": None,  # filled per-mood at request time from the matched world
        })
        sid += 1

with open("songs.json", "w") as f:
    json.dump(songs, f, indent=2)

print(f"Wrote {len(songs)} songs to songs.json")
