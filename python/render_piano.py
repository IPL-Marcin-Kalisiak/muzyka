"""Render one local MusicJSON piano score through the bundled FluidSynth/SF2."""
import argparse
import array
import json
import math
import os
import re
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOUNDFONTS = {
    "ydp": ROOT / "app/instruments/piano/ydp-grand-piano/YDP-GrandPiano-SF2-20160804/YDP-GrandPiano-20160804.sf2",
    "upright-kw": ROOT / "app/instruments/piano/upright-kw/UprightPianoKW-SF2-20220221/UprightPianoKW-20220221.sf2",
}
FLUIDSYNTH = ROOT / "server/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/fluidsynth.exe"
LIBRARY = ROOT / "app/library"
OUTPUT = ROOT / "python/output"
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
PPQ = 480


def wav_peak(path):
    peak = 0
    with wave.open(str(path), "rb") as source:
        if source.getsampwidth() != 2:
            raise ValueError("Renderer powinien zwrócić 16-bitowy WAV.")
        while frames := source.readframes(65536):
            samples = array.array("h")
            samples.frombytes(frames)
            peak = max(peak, max((abs(sample) for sample in samples), default=0))
    return peak


def apply_output_gain(path, requested_db, peak):
    if peak == 0:
        return requested_db
    peak_db = 20 * math.log10(peak / 32768)
    applied_db = min(requested_db, -1 - peak_db)
    if abs(applied_db) < 0.001:
        return 0.0
    factor = 10 ** (applied_db / 20)
    with tempfile.NamedTemporaryFile(dir=OUTPUT, suffix=".wav", delete=False) as temporary:
        temp_path = Path(temporary.name)
    try:
        with wave.open(str(path), "rb") as source, wave.open(str(temp_path), "wb") as destination:
            destination.setparams(source.getparams())
            while frames := source.readframes(65536):
                samples = array.array("h")
                samples.frombytes(frames)
                for index, sample in enumerate(samples):
                    samples[index] = max(-32768, min(32767, round(sample * factor)))
                destination.writeframesraw(samples.tobytes())
        os.replace(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)
    return applied_db


def variable_length(value):
    parts = [value & 0x7f]
    value >>= 7
    while value:
        parts.insert(0, (value & 0x7f) | 0x80)
        value >>= 7
    return bytes(parts)


def chunk(kind, data):
    return kind + struct.pack(">I", len(data)) + data


def note_number(pitch):
    match = re.fullmatch(r"([A-G])([#b]?)([0-8])", pitch) if isinstance(pitch, str) else None
    if not match:
        raise ValueError(f"Nieprawidłowa wysokość nuty: {pitch}")
    value = (int(match[3]) + 1) * 12 + STEPS[match[1]] + {"#": 1, "b": -1, "": 0}[match[2]]
    if not 0 <= value <= 127:
        raise ValueError(f"Wysokość nuty poza zakresem MIDI: {pitch}")
    return value


def parse_score(path):
    score = json.loads(path.read_text(encoding="utf-8"))
    global_data = score.get("global", {})
    tempo = global_data.get("tempo", {})
    if score.get("format") != "MusicJSON" or global_data.get("time_unit") != "eighth_note":
        raise ValueError("Obsługiwany jest MusicJSON z czasem liczonym w ósemkach.")
    tempo_map = global_data.get("tempo_map")
    if tempo_map is None:
        tempo_map = [{"bar": 1, "bpm": tempo.get("bpm"), "beat_unit": tempo.get("beat_unit")}]
    if not isinstance(tempo_map, list) or not tempo_map:
        raise ValueError("Brak poprawnej mapy tempa.")
    tracks = [t for t in score.get("tracks", []) if isinstance(t, dict) and re.search(r"(^|_)piano($|_)", str(t.get("instrument", "")), re.I)]
    if len(tracks) != 1:
        raise ValueError("Oczekiwano jednej ścieżki pianina.")
    track = tracks[0]
    voices = track.get("voices") or [{"id": "other", "notes": track.get("notes", [])}]
    notes = [(voice.get("id"), note) for voice in voices for note in voice.get("notes", [])]
    if not 0 < len(notes) <= 10000:
        raise ValueError("Partytura pianina jest pusta lub zbyt duża.")
    parsed = []
    for index, (hand, note) in enumerate(notes, 1):
        start, duration, velocity = note.get("start"), note.get("duration"), note.get("velocity", 80)
        if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in (start, duration, velocity)) or start < 0 or duration <= 0 or not isinstance(velocity, int) or not 0 <= velocity <= 127:
            raise ValueError(f"Nieprawidłowy czas lub dynamika nuty {index}.")
        parsed.append((hand, note_number(note.get("pitch")), float(start), float(duration), velocity))
    measure_starts = {}
    for _, note in notes:
        measure = note.get("measure")
        if isinstance(measure, int) and not isinstance(measure, bool) and measure >= 1:
            measure_starts[measure] = min(measure_starts.get(measure, float("inf")), float(note["start"]))
    tempos = []
    previous_bar = 0
    for change in tempo_map:
        if not isinstance(change, dict):
            raise ValueError("Nieprawidłowy wpis mapy tempa.")
        bar, bpm = change.get("bar"), change.get("bpm")
        unit = change.get("beat_unit", "quarter" if global_data.get("tempo_map") is not None else None)
        if isinstance(bar, bool) or not isinstance(bar, int) or bar <= previous_bar or isinstance(bpm, bool) or not isinstance(bpm, (int, float)) or not math.isfinite(bpm) or not 0 < bpm <= 300 or unit not in ("quarter", "eighth"):
            raise ValueError("Nieprawidłowy takt, BPM lub jednostka mapy tempa.")
        if bar == 1:
            tick = 0
        elif measure_starts:
            candidates = [start for measure, start in measure_starts.items() if measure >= bar]
            if not candidates:
                break
            tick = round(min(candidates) * PPQ / 2)
        else:
            signature = global_data.get("time_signature", {})
            units_per_bar = signature.get("numerator", 0) * 8 / signature.get("denominator", 1)
            tick = round((bar - 1) * units_per_bar * PPQ / 2)
        microseconds = round((120_000_000 if unit == "eighth" else 60_000_000) / bpm)
        tempos.append((tick, microseconds))
        previous_bar = bar
    if not tempos or tempos[0][0] != 0:
        raise ValueError("Mapa tempa musi zaczynać się od taktu 1.")
    if max(start + duration for _, _, start, duration, _ in parsed) * max(microseconds for _, microseconds in tempos) / 1_000_000 / 2 > 600:
        raise ValueError("Utwór przekracza limit 10 minut.")
    return tempos, parsed


def make_midi(tempos, notes, balance):
    events = [(tick, 0, b"\xff\x51\x03" + microseconds.to_bytes(3, "big")) for tick, microseconds in tempos]
    # Separate MIDI channels make the hand balance independent of sample velocity layers.
    levels = {"left_hand": 1.0, "right_hand": 1.0, "other": 1.0}
    for hand in ("left_hand", "right_hand"):
        velocities = [velocity for name, _, _, _, velocity in notes if name == hand and velocity > 0]
        if velocities:
            rms = math.sqrt(sum(v * v for v in velocities) / len(velocities))
            levels[hand] = rms
    if levels["left_hand"] != 1.0 and levels["right_hand"] != 1.0:
        target = (levels["left_hand"] + levels["right_hand"]) / 2
        for hand in ("left_hand", "right_hand"):
            levels[hand] = target / levels[hand]
        if balance < 0:
            levels["right_hand"] *= (1 - abs(balance) / 100) ** 2
        elif balance > 0:
            levels["left_hand"] *= (1 - balance / 100) ** 2
    channels = {"right_hand": 0, "left_hand": 1, "other": 2}
    for hand, channel in channels.items():
        events.extend([(0, 1, bytes([0xc0 | channel, 0])), (0, 1, bytes([0xb0 | channel, 7, min(127, round(100 * levels[hand]))]))])
    for hand, pitch, start, duration, velocity in notes:
        if velocity == 0 or levels.get(hand, 1) == 0:
            continue
        channel = channels.get(hand, 2)
        begin = round(start * PPQ / 2)
        end = max(begin + 1, round((start + duration) * PPQ / 2))
        events.extend([(begin, 3, bytes([0x90 | channel, pitch, velocity])), (end, 2, bytes([0x80 | channel, pitch, 0]))])
    events.sort(key=lambda event: (event[0], event[1]))
    track = bytearray()
    previous = 0
    for tick, _, message in events:
        track.extend(variable_length(tick - previous) + message)
        previous = tick
    track.extend(b"\x00\xff\x2f\x00")
    return chunk(b"MThd", struct.pack(">HHH", 0, 1, PPQ)) + chunk(b"MTrk", track)


def parse_midi_conversion(score, balance):
    """Preserve tick-based MusicJSON 0.2 MIDI performance, including pedal."""
    global_data = score.get("global", {})
    ppq = global_data.get("ticks_per_beat")
    if isinstance(ppq, bool) or not isinstance(ppq, int) or not 1 <= ppq <= 32767:
        raise ValueError("MusicJSON 0.2 wymaga poprawnego global.ticks_per_beat.")
    tempo_map = global_data.get("tempo_map")
    if not isinstance(tempo_map, list) or not tempo_map or not isinstance(tempo_map[0], dict) or tempo_map[0].get("tick") != 0:
        raise ValueError("Mapa tempa MIDI musi zaczynać się od tick 0.")
    events = []
    previous_tick = -1
    for item in tempo_map:
        if not isinstance(item, dict):
            raise ValueError("Nieprawidłowy wpis mapy tempa MIDI.")
        tick, tempo = item.get("tick"), item.get("microseconds_per_beat")
        if isinstance(tick, bool) or not isinstance(tick, int) or tick <= previous_tick or isinstance(tempo, bool) or not isinstance(tempo, int) or not 1 <= tempo <= 0xFFFFFF:
            raise ValueError("Nieprawidłowa zmiana tempa MIDI.")
        events.append((tick, 0, b"\xff\x51\x03" + tempo.to_bytes(3, "big")))
        previous_tick = tick
    tracks = score.get("tracks")
    if not isinstance(tracks, list) or not tracks:
        raise ValueError("Brak ścieżek pianina w MusicJSON 0.2.")
    notes = []
    controls = []
    for track in tracks:
        if not isinstance(track, dict) or not isinstance(track.get("instrument"), str) or not re.search(r"piano|acoustic grand", track["instrument"], re.I):
            raise ValueError("MusicJSON 0.2 zawiera nieobsługiwaną ścieżkę instrumentu.")
        hand = track.get("hand")
        if hand not in ("left", "right"):
            raise ValueError("Ścieżka MusicJSON 0.2 wymaga hand: left lub right.")
        channel = 0 if hand == "right" else 1
        for index, note in enumerate(track.get("notes", []), 1):
            if not isinstance(note, dict):
                raise ValueError(f"Nieprawidłowa nuta {index} ścieżki {hand}.")
            start, duration, velocity = note.get("start_tick"), note.get("duration_ticks"), note.get("velocity")
            if any(isinstance(x, bool) or not isinstance(x, int) for x in (start, duration, velocity)) or start < 0 or duration <= 0 or not 0 <= velocity <= 127:
                raise ValueError(f"Nieprawidłowy czas lub velocity nuty {index} ścieżki {hand}.")
            if note.get("hand", hand) != hand:
                raise ValueError(f"Niezgodna ręka nuty {index} ścieżki {hand}.")
            pitch = note_number(note.get("pitch"))
            if note.get("midi_note", pitch) != pitch:
                raise ValueError(f"Niezgodne pitch i midi_note nuty {index} ścieżki {hand}.")
            notes.append((hand, channel, pitch, start, duration, velocity))
        for control in track.get("control_changes", []):
            tick, number, value = control.get("tick"), control.get("control"), control.get("value")
            if any(isinstance(x, bool) or not isinstance(x, int) for x in (tick, number, value)) or tick < 0 or not 0 <= number <= 127 or not 0 <= value <= 127:
                raise ValueError(f"Nieprawidłowe zdarzenie MIDI CC ścieżki {hand}.")
            # CC11 belongs to the user's balance slider, independent of source CC7.
            if number != 11:
                controls.append((tick, channel, number, value))
    if not 0 < len(notes) <= 10000:
        raise ValueError("Partytura pianina jest pusta lub zbyt duża.")
    if max(start + duration for _, _, _, start, duration, _ in notes) / ppq * max(item["microseconds_per_beat"] for item in tempo_map) / 1_000_000 > 600:
        raise ValueError("Utwór przekracza limit 10 minut.")
    levels = {}
    for hand in ("left", "right"):
        values = [velocity for name, _, _, _, _, velocity in notes if name == hand and velocity > 0]
        levels[hand] = math.sqrt(sum(v * v for v in values) / len(values)) if values else 1.0
    if levels["left"] != 1.0 and levels["right"] != 1.0:
        target = (levels["left"] + levels["right"]) / 2
        levels = {hand: target / value for hand, value in levels.items()}
        levels["right" if balance < 0 else "left"] *= (1 - abs(balance) / 100) ** 2
    for hand, channel in (("right", 0), ("left", 1)):
        events.append((0, 1, bytes([0xC0 | channel, 0])))
        events.append((0, 1, bytes([0xB0 | channel, 11, min(127, round(100 * levels[hand]))])))
    for tick, channel, number, value in controls:
        events.append((tick, 1, bytes([0xB0 | channel, number, value])))
    for hand, channel, pitch, start, duration, velocity in notes:
        if velocity and levels[hand] > 0:
            events.extend(((start, 3, bytes([0x90 | channel, pitch, velocity])), (start + duration, 2, bytes([0x80 | channel, pitch, 0]))))
    events.sort(key=lambda event: (event[0], event[1]))
    track_data = bytearray()
    previous = 0
    for tick, _, message in events:
        track_data.extend(variable_length(tick - previous) + message)
        previous = tick
    track_data.extend(b"\x00\xff\x2f\x00")
    return chunk(b"MThd", struct.pack(">HHH", 0, 1, ppq)) + chunk(b"MTrk", track_data), len(notes)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--score", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--balance", type=int, default=0)
    parser.add_argument("--model", choices=SOUNDFONTS.keys(), default="ydp")
    parser.add_argument("--gain-db", type=int, default=0)
    parser.add_argument("--analyze", action="store_true")
    args = parser.parse_args()
    score = Path(args.score).resolve()
    output = Path(args.output).resolve()
    if score.parent != LIBRARY.resolve() or score.suffix.lower() != ".json":
        raise ValueError("Partytura musi znajdować się w app/library.")
    if output.parent != OUTPUT.resolve() or output.suffix.lower() != ".wav":
        raise ValueError("Wynik musi znajdować się w python/output.")
    if not -100 <= args.balance <= 100:
        raise ValueError("Balans poza zakresem -100..100.")
    if not -12 <= args.gain_db <= 12:
        raise ValueError("Poziom końcowy poza zakresem -12..+12 dB.")
    source = json.loads(score.read_text(encoding="utf-8"))
    if source.get("format") != "MusicJSON":
        raise ValueError("Oczekiwano partytury MusicJSON.")
    if source.get("format_version") in ("0.2", "0.3") and source.get("global", {}).get("time_unit") is None:
        midi_bytes, count = parse_midi_conversion(source, args.balance)
    else:
        tempos, notes = parse_score(score)
        midi_bytes, count = make_midi(tempos, notes, args.balance), len(notes)
    output.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=OUTPUT) as temp_dir:
        midi = Path(temp_dir) / "score.mid"
        midi.write_bytes(midi_bytes)
        command = [str(FLUIDSYNTH), "-ni", "-R", "0", "-C", "0", "-g", "0.4", "-r", "44100", "-F", str(output), str(SOUNDFONTS[args.model]), str(midi)]
        result = subprocess.run(command, capture_output=True, text=True, timeout=180, cwd=ROOT)
        if result.returncode != 0 or not output.is_file():
            raise RuntimeError((result.stderr or result.stdout or "FluidSynth nie utworzył WAV.")[-1000:])
    peak = wav_peak(output)
    peak_db = 20 * math.log10(peak / 32768) if peak else -120.0
    if args.analyze:
        output.unlink()
        print(json.dumps({"notes": count, "peakDbfs": round(peak_db, 2)}))
        return
    applied_db = apply_output_gain(output, args.gain_db, peak)
    print(json.dumps({"notes": count, "peakDbfs": round(peak_db, 2), "appliedGainDb": round(applied_db, 2)}))


if __name__ == "__main__":
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        main()
    except (ValueError, RuntimeError, subprocess.TimeoutExpired, OSError, json.JSONDecodeError) as error:
        print(f"Błąd renderowania: {error}", file=sys.stderr)
        sys.exit(1)
