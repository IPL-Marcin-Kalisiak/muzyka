# MusicJSON — opis partytury źródłowej AI Orchestra

Stan: 2026-09-13. Ten plik jest punktem odniesienia przy tworzeniu i zmianie partytur w `app/library`. Opisuje format **0.1** oraz osobną ścieżkę konwersji MIDI **0.2**; nie należy mieszać ich jednostek czasu. Wskazuje też reguły, które chcemy utrwalić w przyszłym schemacie. `song.json` to robocza nazwa roli partytury źródłowej; obecne pliki mają indywidualne nazwy. JSON jest źródłem prawdy, MIDI i WAV są wynikami.

Pianino obsługuje również MusicJSON **0.3** z czasem w tickach MIDI, np. `vivaldi_spring_allegro_piano.json`: dwie ścieżki `instrument: "piano"`, `hand: "right"` i `"left"`, nuty z `start_tick`, `duration_ticks`, `pitch`, `midi_note` i `velocity`, a w `global` `ticks_per_beat` i mapę `tempo_map` z `tick` oraz `microseconds_per_beat`. Renderer próbkowany używa dla tego układu tego samego parsera MIDI co 0.2. Podgląd syntetyczny w przeglądarce nadal obsługuje tylko zapis 0.1; wersje MIDI należy renderować przez Python + FluidSynth.

## Gitara klasyczna: MusicJSON 0.3

Gitarowy renderer Python obsługuje także **0.4**: jedna ścieżka z `notes[]` oraz opcjonalne dodatkowe ścieżki gitary z `events[]`, których wpisy mają `event_type: "guitar_percussion"`, `technique`, `start_tick`, `duration_ticks`, `velocity`. Dostępne techniki są opisane w [`../dokumentacja/renderowanie-gitary.md`](../dokumentacja/renderowanie-gitary.md). Eksport syntetyczny w przeglądarce pozostaje przy 0.3; dla 0.4 wybierz renderer Python. Przykład `despacito_full_solo_guitar.json` zawiera 228 nut i 202 zdarzenia perkusyjne, około 46 sekund zapisanej treści.

**0.5** zachowuje te same nuty i zdarzenia, ale może podawać stałe tempo w `global.tempo_bpm` zamiast `global.tempo_map`. Renderer oblicza `microseconds_per_beat = round(60 000 000 / tempo_bpm)`; przykładem jest `latin_fingerstyle_training_full.json` z 1241 nutami i 470 zdarzeniami perkusyjnymi. Wersję 0.5 również renderuj przez lokalny Python.

`app/library/in_the_hall_of_the_mountain_king_classical_guitar.json` jest pierwszą działającą partyturą gitary. `tracks[].instrument` ma wartość `classical_guitar`; tylko takie ścieżki trafiają na stronę `/guitar`. Wersja 0.3 używa **ticków MIDI**, nie ósemek wersji 0.1. `global.ticks_per_beat` określa liczbę ticków na ćwierćnutę. `global.tempo_map[]` zawiera rosnące `tick` i `microseconds_per_beat`, pierwszy wpis zaczyna się w ticku 0. Każda nuta w jedynej ścieżce gitary ma całkowite `start_tick`, dodatnie `duration_ticks`, `midi_note` 0–127 i `velocity` 0–127. Opcjonalne `string` oraz `fret` oznaczają strunę i próg; są zachowane w JSON, lecz nie wpływają obecnie na próbkowany WAV. `instrument.midi_program` opisuje brzmienie GM, ale renderer wybiera lokalny bank SF2 i jego preset 24. Dane opisowe `project`, `conversion` i pola renderowania są metadanymi; nie należy zakładać, że wszystkie są wykonywane. Lista katalogowa nie zastępuje walidacji pełnej partytury.

## Minimalny działający przykład pianina

```json
{
  "format": "MusicJSON",
  "format_version": "0.1",
  "project": {
    "title": "Przykład pianina",
    "composer": "Autor"
  },
  "global": {
    "time_signature": { "numerator": 3, "denominator": 8 },
    "tempo": { "bpm": 72, "beat_unit": "eighth" },
    "time_unit": "eighth_note",
    "ticks_per_beat": 480
  },
  "tracks": [
    {
      "id": "piano",
      "instrument": "acoustic_grand_piano",
      "voices": [
        {
          "id": "right_hand",
          "staff": "treble",
          "notes": [
            { "pitch": "E5", "start": 0, "duration": 0.5, "velocity": 82, "measure": 1 }
          ]
        },
        {
          "id": "left_hand",
          "staff": "bass",
          "notes": [
            { "pitch": "A3", "start": 0, "duration": 1, "velocity": 70, "measure": 1 }
          ]
        }
      ]
    }
  ]
}
```

Bez komentarzy i przecinków po ostatnich elementach: plik musi być poprawnym JSON kodowanym UTF-8. Nowy utwór pianina zapisuj w `app/library/*.json`; katalog rozpoznaje ścieżkę po `tracks[].instrument` zawierającym człon `piano`. Samo wyświetlenie na liście **nie gwarantuje**, że cała partytura przejdzie walidację renderera.

## Pola i znaczenie w wersji 0.1

| Ścieżka | Typ / przykład | Znaczenie i obecne zachowanie |
|---|---|
| `format`, `format_version` | `"MusicJSON"`, `"0.1"` | Identyfikacja formatu. Renderer sprawdza `format`; wersja jest zapisana, lecz nie wymusza jeszcze walidacji schematu. |
| `project.title` | tekst | Tytuł na liście partytur; przy braku używana jest nazwa pliku. |
| `project.composer`, `work`, `arrangement`, `source_note`, `instrumentation` | teksty / lista tekstów | Informacja o autorstwie, pochodzeniu i obsadzie; nie wpływa na audio. |
| `global.key` | np. `"A minor"` | Opis tonacji; nie transponuje nut. |
| `global.time_signature.numerator`, `.denominator` | np. `3`, `8` | Metrum. Pomaga ustalić takty przy mapie tempa bez numerów `measure`; nie zmienia samo czasu nut. |
| `global.time_unit` | `"eighth_note"` | Jednostka pól `start` i `duration`. To jedyna obecnie obsługiwana wartość. |
| `global.ticks_per_beat` | `480` | Pole w partyturze; renderer obecnie używa wewnętrznie stałego PPQ 480 i **nie czyta** tej wartości. |
| `global.tempo.bpm`, `.beat_unit` | `72`, `"eighth"` | Jedno stałe tempo. Dla tego przykładu jedna ósemka trwa `60 / 72 ≈ 0,833 s`. Obecny renderer wymaga tu `beat_unit` równym `eighth`. |
| `global.tempo_map[]` | `{ "bar": 1, "bpm": 72 }` | Zmiany tempa. Numery taktów rosną; pierwszy wpis ma `bar: 1`. W mapie brak `beat_unit` oznacza **ćwierćnutę**, więc przy 72 BPM ósemka trwa `30 / 72 ≈ 0,417 s`. Można wpisać `beat_unit: "eighth"` albo `"quarter"` jawnie. |
| `tracks[]` | lista obiektów | Ścieżki instrumentów. Obecny eksport pianina wymaga dokładnie jednej ścieżki pianina. |
| `tracks[].id` | np. `"piano"` | Stabilna nazwa ścieżki; obecnie informacyjna. |
| `tracks[].instrument` | `"acoustic_grand_piano"` | Identyfikacja instrumentu i wybór strony pianina. Brzmienie wynika obecnie z aktywnego renderera, nie z dowolnej nazwy presetu w JSON. |
| `tracks[].midi_program`, `.channel` | `0`, `0` | Deklaracje MIDI w plikach; obecny renderer ustawia własne kanały rąk i program 0. |
| `tracks[].voices[]` | lista głosów | Oddzielne partie, obecnie zwykle prawa i lewa ręka. Alternatywne `tracks[].notes[]` też jest rozpoznawane, jeśli nie ma `voices`. |
| `voices[].id` | `"right_hand"`, `"left_hand"` | Te identyfikatory uruchamiają balans rąk; inne głosy trafiają do grupy `other`. |
| `voices[].staff` | `"treble"`, `"bass"` | Wskazówka notacyjna, bez wpływu na syntezę. |
| `notes[].pitch` | np. `"C4"`, `"F#3"`, `"Bb4"` | Wysokość w notacji angielskiej, oktawy 0–8; wynik musi mieścić się w MIDI 0–127. `C4` to MIDI 60. |
| `notes[].start` | liczba `≥ 0` | Początek nuty w jednostkach `time_unit`, względem początku utworu; nie czas w sekundach. |
| `notes[].duration` | liczba `> 0` | Czas od włączenia do wyłączenia nuty w tych samych jednostkach. Nuty mogą się nakładać. |
| `notes[].velocity` | liczba całkowita `0…127`, domyślnie `80` | Dynamika MIDI. `0` daje nutę niemą. Velocity wpływa na warstwy próbek SF2. |
| `notes[].measure` | numer taktu | W nowych plikach licz od **1**. Starsze „Dla Elizy” mają też `0`; renderer toleruje to przy stałym tempie. Przy `tempo_map` używa pierwszej nuty wskazanego taktu do ustalenia momentu zmiany. |
| `notes[].articulation` | np. `staccato`, `legato`, `accent`, `marcato`, `fermata` | Pole występuje w plikach, ale **nie jest jeszcze wykonywane**. Sama długość `duration` nadal działa. |
| `tracks[].mix` | np. `right_hand_gain_db`, `left_hand_gain_db`, `master_headroom_db`, `reverb_hint` | Zapisane sugestie miksu, obecnie ignorowane przez renderer. Suwak balansu na stronie jest osobnym parametrem eksportu. |
| `tracks[].render` | np. `{ "engine": "midi_vst", "preset": "grand_piano" }` | Historyczna deklaracja/intencja; obecnie nie wybiera VST. Wybór brzmienia jest w interfejsie. |
| `analysis` | obiekt z notatkami | Opis roboczy, poza wykonaniem; pola różnią się między utworami. |

## Czas, tempo i takty — przykłady

- W `3/8` z `time_unit: "eighth_note"`, takt ma nominalnie 3 jednostki. Przy `tempo: {"bpm":72,"beat_unit":"eighth"}` nuta `start: 1`, `duration: 0.5` zaczyna się po około `0,833 s` i trwa około `0,417 s`.
- W `4/4` takt ma nominalnie 8 ósemek. Przy `tempo_map: [{"bar":1,"bpm":72},{"bar":9,"bpm":82}]` oraz braku `beat_unit`, BPM dotyczy ćwierćnut. Utwór przyspiesza od pierwszej nuty przypisanej do taktu 9; bez numerów `measure` renderer wykorzystuje metrum. Mapy są skokowe, bez interpolacji/ritardando.
- `start` jest pozycją muzyczną. Zmiana tempa nie wymaga przepisywania wartości `start`; renderer przelicza je na sekundy/MIDI. Jeżeli `measure` i `start` nie są ze sobą zgodne, wynik mapy tempa może być mylący. W przyszłej wersji trzeba walidować tę zgodność i określić kanoniczną definicję początku taktu.
- Nie zapisuj jednocześnie `tempo` i `tempo_map` w nowym pliku. Obecny kod wybierze `tempo_map`, jeśli istnieje, ale to byłaby niepotrzebna dwuznaczność.
- Balans rąk i poziom końcowego WAV są obecnie parametrami eksportu na stronie, nie polami partytury; zmiana suwaków nie modyfikuje JSON.

## MusicJSON 0.2 po bezpośredniej konwersji MIDI

Plik `in_the_hall_of_the_mountain_king_original_from_midi.json` ma inny model danych niż powyższe partytury 0.1. Jego `conversion` opisuje pochodzenie; `global.ticks_per_beat: 384` określa rozdzielczość oryginalnego MIDI. `global.tempo_map` używa `{ "tick": 0, "microseconds_per_beat": 434782, "bpm": 138.000193 }`, gdzie źródłem tempa dla renderera jest całkowita liczba mikrosekund na ćwierćnutę. `global.time_signatures` i `text_events` zachowują metadane MIDI. Nie ma `global.time_unit`, `global.tempo` ani `voices`.

Każda z dwóch ścieżek ma `hand: "right"` lub `"left"` i własną tablicę `notes`. Nuta używa `start_tick`, `duration_ticks`, `pitch`, `midi_note`, `velocity`; dodatkowe `start_beat`, `start_seconds`, `duration_beats`, `duration_seconds`, `release_velocity`, `event_type`, `chord_id`, `chord_pitches` zachowują opis konwersji, ale nie zastępują ticków przy renderowaniu. `control_changes` zawiera np. `{ "tick": 38400, "control": 64, "value": 127, "channel": 1 }`: CC64 włącza/wyłącza pedał; CC7 zachowuje poziom MIDI; CC11 jest zarezerwowane na niezależny balans rąk w interfejsie. `program_changes`, `key_signatures`, `statistics`, `conversion` i opisy źródła nie zmieniają obecnego brzmienia SF2.

Ten format renderuje **lokalny Python + FluidSynth**. Wariant syntetyczny przeglądarki wymaga 0.1. Dla nowego projektu komponowanego ręcznie używaj przykładu 0.1 do czasu zdefiniowania wspólnego, wersjonowanego schematu; 0.2 służy na razie wiernej konwersji zdarzeń MIDI. Nie nazywaj `start_tick` ósemkami ani nie przeliczaj zmiany tempa z numerów taktów: tutaj skala jest określona przez PPQ i ticki.

## Wymagania praktyczne nowej partytury

1. Zapisz poprawny UTF-8 JSON i `format: "MusicJSON"`, `format_version: "0.1"`.
2. Ustaw `global.time_unit: "eighth_note"` i **jawne** `beat_unit` przy tempie. Przy zmianach tempa zacznij `tempo_map` od `bar: 1`, uporządkuj takty rosnąco i podaj `beat_unit` przy każdym wpisie, nawet jeśli obecny kod umie przyjąć domyślną ćwierćnutę.
3. Użyj jednej ścieżki `instrument: "acoustic_grand_piano"`, głosów `right_hand` / `left_hand` oraz `pitch`, `start`, `duration`, `velocity`, `measure` w każdej nucie. Numeruj takty od 1, zachowaj zgodność `measure` z pozycją `start`.
4. Traktuj `articulation`, `mix` i `render` jako opis zamiaru, dopóki nie powstanie i nie zostanie przetestowana ich semantyka wykonawcza. Nie wpisuj tam ustawień, od których zależy poprawność odsłuchu.
5. Obecne limity renderowania: 1 ścieżka pianina, od 1 do 10 000 nut i najwyżej 10 minut podglądu. Plik z większą liczbą ścieżek lub innej jednostce czasu wymaga nowego renderera/schematu.

## Co doprecyzować przed stabilnym schematem

Format 0.1 nie ma formalnego JSON Schema. Następna wersja powinna określić kanoniczną numerację taktów (od 1), relację `start` do metrum, jawne jednostki wszystkich wartości BPM, pierwszeństwo `tempo`/`tempo_map`, zachowanie pauz i nut przez zmianę tempa, identyfikatory ścieżek i głosów, interpretację `mix`/artykulacji/pedału oraz wersjonowanie i migrację starszych plików. Walidacja powinna wskazywać dokładną ścieżkę błędu, np. `tracks[0].voices[1].notes[12].velocity`. Nie należy ogłaszać tych planowanych reguł jako już zaimplementowanych.

Źródło wizji: [`../AI_Orchestra_założenia_projektu.md`](../AI_Orchestra_założenia_projektu.md). Bieżący silnik i próbki: [`INSTRUMENT_ENGINES.md`](INSTRUMENT_ENGINES.md).
