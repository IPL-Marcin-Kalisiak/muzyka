"""Render a MusicJSON 0.3 classical guitar score using the local FreePats SF2."""
import argparse
import array
import json
import math
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARY = ROOT / "app/library"
OUTPUT = ROOT / "python/output"
SOUNDFONT = ROOT / "app/instruments/guitar/freepats-spanish-classical/SpanishClassicalGuitar-SF2-20190618/SpanishClassicalGuitar-20190618.sf2"
FLUIDSYNTH = ROOT / "server/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/fluidsynth.exe"


def vlq(value):
    result = [value & 127]
    value >>= 7
    while value:
        result.insert(0, (value & 127) | 128)
        value >>= 7
    return bytes(result)


def midi_chunk(kind, data):
    return kind + struct.pack(">I", len(data)) + data


def make_midi(score):
    if score.get("format") != "MusicJSON" or score.get("format_version") not in ("0.3", "0.4", "0.5"):
        raise ValueError("Wymagany jest gitarowy MusicJSON 0.3, 0.4 lub 0.5.")
    global_data = score.get("global", {})
    ppq = global_data.get("ticks_per_beat")
    if not isinstance(ppq, int) or not 1 <= ppq <= 32767:
        raise ValueError("Nieprawidłowe ticks_per_beat.")
    tempos = global_data.get("tempo_map")
    if tempos is None and score["format_version"] == "0.5":
        bpm = global_data.get("tempo_bpm")
        if isinstance(bpm, bool) or not isinstance(bpm, (int, float)) or not math.isfinite(bpm) or not 1 <= bpm <= 1000:
            raise ValueError("MusicJSON 0.5 wymaga poprawnego global.tempo_bpm lub tempo_map.")
        tempos = [{"tick": 0, "microseconds_per_beat": round(60_000_000 / bpm)}]
    if not isinstance(tempos, list) or not tempos or tempos[0].get("tick") != 0:
        raise ValueError("Brak mapy tempa od tick 0.")
    tracks = score.get("tracks", [])
    if not isinstance(tracks, list):
        raise ValueError("Brak ścieżek gitary.")
    note_tracks = [track for track in tracks if isinstance(track, dict) and "guitar" in str(track.get("instrument", "")).lower() and isinstance(track.get("notes"), list)]
    if len(note_tracks) != 1:
        raise ValueError("Wymagana jest jedna ścieżka nut gitary.")
    notes = note_tracks[0]["notes"]
    if not 1 <= len(notes) <= 10000:
        raise ValueError("Partytura jest pusta lub zbyt duża.")
    events = [(0, 1, bytes([0xC0, 24]))]
    previous_tempo_tick = -1
    for change in tempos:
        tick, tempo = change.get("tick"), change.get("microseconds_per_beat")
        if not isinstance(tick, int) or tick <= previous_tempo_tick or not isinstance(tempo, int) or not 1 <= tempo <= 0xFFFFFF:
            raise ValueError("Nieprawidłowa mapa tempa.")
        events.append((tick, 0, b"\xff\x51\x03" + tempo.to_bytes(3, "big")))
        previous_tempo_tick = tick
    latest = 0
    for index, note in enumerate(notes):
        if not isinstance(note, dict):
            raise ValueError(f"Nieprawidłowa nuta {index + 1}.")
        start, duration, pitch, velocity = (note.get(key) for key in ("start_tick", "duration_ticks", "midi_note", "velocity"))
        if not all(isinstance(value, int) for value in (start, duration, pitch, velocity)) or start < 0 or duration <= 0 or not 0 <= pitch <= 127 or not 0 <= velocity <= 127:
            raise ValueError(f"Nieprawidłowa nuta {index + 1}.")
        latest = max(latest, start + duration)
        events.append((start, 2, bytes([0x90, pitch, velocity])))
        events.append((start + duration, 1, bytes([0x80, pitch, 0])))
    # Guard against an unexpectedly long render using the slowest listed tempo.
    if latest / ppq * max(change["microseconds_per_beat"] for change in tempos) / 1_000_000 > 600:
        raise ValueError("Partytura przekracza 10 minut.")
    percussion = []
    for track in tracks:
        if not isinstance(track, dict) or track is note_tracks[0]:
            continue
        if score["format_version"] not in ("0.4", "0.5") or not "guitar" in str(track.get("instrument", "")).lower() or not isinstance(track.get("events"), list):
            raise ValueError("Nieobsługiwana dodatkowa ścieżka gitarowa.")
        percussion.extend(track["events"])
    if len(percussion) > 10000:
        raise ValueError("Za dużo zdarzeń perkusyjnych.")
    for index, event in enumerate(percussion):
        if not isinstance(event, dict) or event.get("event_type") != "guitar_percussion" or event.get("technique") not in ("body_tap_low", "muted_string_slap", "muted_high_string_tick", "rasgueado_accent"):
            raise ValueError(f"Nieobsługiwane zdarzenie gitary {index + 1}.")
        tick, duration, velocity = (event.get(key) for key in ("start_tick", "duration_ticks", "velocity"))
        if any(isinstance(value, bool) or not isinstance(value, int) for value in (tick, duration, velocity)) or tick < 0 or duration <= 0 or not 0 <= velocity <= 127:
            raise ValueError(f"Nieprawidłowy czas lub velocity zdarzenia {index + 1}.")
        latest = max(latest, tick + duration)
    if latest / ppq * max(change["microseconds_per_beat"] for change in tempos) / 1_000_000 > 600:
        raise ValueError("Partytura przekracza 10 minut.")
    events.sort(key=lambda event: (event[0], event[1]))
    data = bytearray()
    previous = 0
    for tick, _, message in events:
        data.extend(vlq(tick - previous) + message)
        previous = tick
    data.extend(b"\x00\xff\x2f\x00")
    return midi_chunk(b"MThd", struct.pack(">HHH", 0, 1, ppq)) + midi_chunk(b"MTrk", data), len(notes), percussion, tempos, ppq


def add_percussion(path, events, tempos, ppq):
    if not events:
        return
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        if params.sampwidth != 2 or params.nchannels != 2:
            raise ValueError("Perkusja gitarowa wymaga 16-bitowego stereo WAV.")
        samples = array.array("h")
        samples.frombytes(source.readframes(source.getnframes()))
    rate = params.framerate
    total_frames = len(samples) // 2

    def seconds_at(tick):
        seconds = 0.0
        previous = tempos[0]
        for change in tempos[1:]:
            if tick < change["tick"]:
                break
            seconds += (change["tick"] - previous["tick"]) * previous["microseconds_per_beat"] / ppq / 1_000_000
            previous = change
        return seconds + (tick - previous["tick"]) * previous["microseconds_per_beat"] / ppq / 1_000_000

    for event in events:
        first = round(seconds_at(event["start_tick"]) * rate)
        technique = event["technique"]
        length = int(rate * (0.12 if technique == "body_tap_low" else 0.065))
        level = event["velocity"] / 127
        for offset in range(min(length, max(0, total_frames - first))):
            time = offset / rate
            decay = math.exp(-time * (38 if technique == "body_tap_low" else 85))
            if technique == "body_tap_low":
                signal = math.sin(2 * math.pi * (125 * time - 80 * time * time)) * decay * 0.15
            else:
                # Deterministic bright, short transient for muted strings and rasgueado.
                noise = math.sin(offset * 1.91) * math.sin(offset * 0.37) + 0.4 * math.sin(offset * 2.73)
                signal = noise * decay * (0.065 if technique == "muted_high_string_tick" else 0.11)
            value = round(signal * level * 32767)
            for channel in (0, 1):
                index = (first + offset) * 2 + channel
                samples[index] = max(-32768, min(32767, samples[index] + value))
    with wave.open(str(path), "wb") as destination:
        destination.setparams(params)
        destination.writeframes(samples.tobytes())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--score", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if not args.score.resolve().is_relative_to(LIBRARY.resolve()) or args.score.suffix.lower() != ".json":
        raise ValueError("Partytura musi pochodzić z app/library.")
    if not args.output.resolve().is_relative_to(OUTPUT.resolve()) or args.output.suffix.lower() != ".wav":
        raise ValueError("Plik wyjściowy musi być WAV w python/output.")
    midi, count, percussion, tempos, ppq = make_midi(json.loads(args.score.read_text(encoding="utf-8")))
    with tempfile.NamedTemporaryFile(dir=OUTPUT, suffix=".mid", delete=False) as temporary:
        midi_path = Path(temporary.name)
    try:
        midi_path.write_bytes(midi)
        command = [str(FLUIDSYNTH), "-ni", "-R", "0", "-C", "0", "-g", "0.5", "-r", "44100", "-F", str(args.output), str(SOUNDFONT), str(midi_path)]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=180, cwd=ROOT)
        if completed.returncode or not args.output.is_file():
            raise RuntimeError(completed.stderr.strip() or completed.stdout.strip() or "FluidSynth nie zwrócił WAV.")
        add_percussion(args.output, percussion, tempos, ppq)
        print(json.dumps({"notes": count, "percussion": len(percussion), "bytes": args.output.stat().st_size}))
    finally:
        midi_path.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        main()
    except (ValueError, OSError, KeyError, json.JSONDecodeError, subprocess.TimeoutExpired, wave.Error) as error:
        print(f"Błąd renderowania gitary: {error}", file=sys.stderr)
        sys.exit(1)
