"""Render one MusicJSON violin score through bundled FluidSynth and FreePats GM."""
import argparse, json, struct, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARY = ROOT / "app/library"
OUTPUT = ROOT / "python/output"
SOUNDFONT = ROOT / "app/instruments/violin/freepats-gm/FreePatsGM-SF2-20221026/FreePatsGM-20221026.sf2"
FLUIDSYNTH = ROOT / "server/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/fluidsynth.exe"

def vlq(value):
    result = [value & 127]; value >>= 7
    while value: result.insert(0, (value & 127) | 128); value >>= 7
    return bytes(result)

def chunk(kind, data): return kind + struct.pack(">I", len(data)) + data

def make_midi(score):
    if score.get("format") != "MusicJSON" or score.get("format_version") != "0.3":
        raise ValueError("Wymagany jest skrzypcowy MusicJSON 0.3.")
    global_data = score.get("global", {}); ppq = global_data.get("ticks_per_beat"); tempos = global_data.get("tempo_map")
    if isinstance(ppq, bool) or not isinstance(ppq, int) or not 1 <= ppq <= 32767: raise ValueError("Nieprawidłowe ticks_per_beat.")
    if not isinstance(tempos, list) or not tempos or tempos[0].get("tick") != 0: raise ValueError("Mapa tempa musi zaczynać się od tick 0.")
    tracks = [track for track in score.get("tracks", []) if isinstance(track, dict) and "violin" in str(track.get("instrument", "")).lower()]
    if len(tracks) != 1 or not isinstance(tracks[0].get("notes"), list): raise ValueError("Wymagana jest jedna ścieżka skrzypiec.")
    notes = tracks[0]["notes"]
    if not 1 <= len(notes) <= 10000: raise ValueError("Partytura jest pusta lub zbyt duża.")
    events = [(0, 1, bytes([0xC0, 40]))]; previous_tempo = -1
    for change in tempos:
        tick, tempo = change.get("tick"), change.get("microseconds_per_beat")
        if isinstance(tick, bool) or not isinstance(tick, int) or tick <= previous_tempo or isinstance(tempo, bool) or not isinstance(tempo, int) or not 1 <= tempo <= 0xFFFFFF: raise ValueError("Nieprawidłowa mapa tempa.")
        events.append((tick, 0, b"\xff\x51\x03" + tempo.to_bytes(3, "big"))); previous_tempo = tick
    latest = 0
    for index, note in enumerate(notes, 1):
        if not isinstance(note, dict): raise ValueError(f"Nieprawidłowa nuta {index}.")
        start, duration, pitch, velocity = (note.get(key) for key in ("start_tick", "duration_ticks", "midi_note", "velocity"))
        if any(isinstance(value, bool) or not isinstance(value, int) for value in (start, duration, pitch, velocity)) or start < 0 or duration <= 0 or not 0 <= pitch <= 127 or not 0 <= velocity <= 127: raise ValueError(f"Nieprawidłowa nuta {index}.")
        latest = max(latest, start + duration)
        if velocity: events.extend(((start, 2, bytes([0x90, pitch, velocity])), (start + duration, 1, bytes([0x80, pitch, 0]))))
    if latest / ppq * max(t["microseconds_per_beat"] for t in tempos) / 1_000_000 > 600: raise ValueError("Partytura przekracza 10 minut.")
    events.sort(key=lambda event: (event[0], event[1])); data = bytearray(); previous = 0
    for tick, _, message in events: data.extend(vlq(tick - previous) + message); previous = tick
    data.extend(b"\x00\xff\x2f\x00")
    return chunk(b"MThd", struct.pack(">HHH", 0, 1, ppq)) + chunk(b"MTrk", data), len(notes)

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--score", required=True, type=Path); parser.add_argument("--output", required=True, type=Path); args = parser.parse_args()
    if not args.score.resolve().is_relative_to(LIBRARY.resolve()) or args.score.suffix.lower() != ".json": raise ValueError("Partytura musi pochodzić z app/library.")
    if not args.output.resolve().is_relative_to(OUTPUT.resolve()) or args.output.suffix.lower() != ".wav": raise ValueError("Wynik musi być WAV w python/output.")
    midi, count = make_midi(json.loads(args.score.read_text(encoding="utf-8")))
    with tempfile.NamedTemporaryFile(dir=OUTPUT, suffix=".mid", delete=False) as temporary: midi_path = Path(temporary.name)
    try:
        midi_path.write_bytes(midi)
        result = subprocess.run([str(FLUIDSYNTH), "-ni", "-R", "0", "-C", "0", "-g", "2.2", "-r", "44100", "-F", str(args.output), str(SOUNDFONT), str(midi_path)], capture_output=True, text=True, timeout=180, cwd=ROOT)
        if result.returncode or not args.output.is_file(): raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "FluidSynth nie zwrócił WAV.")
        print(json.dumps({"notes": count, "bytes": args.output.stat().st_size}))
    finally: midi_path.unlink(missing_ok=True)

if __name__ == "__main__":
    sys.stderr.reconfigure(encoding="utf-8")
    try: main()
    except (ValueError, RuntimeError, OSError, json.JSONDecodeError, subprocess.TimeoutExpired) as error:
        print(f"Błąd renderowania skrzypiec: {error}", file=sys.stderr); sys.exit(1)

