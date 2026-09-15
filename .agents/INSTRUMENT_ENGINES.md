# Biblioteki, silniki i zasoby instrumentów AI Orchestra

Stan: 2026-09-13. To rejestr **faktycznie używanych** składników projektu. Aktualizuj go przy dodaniu, wymianie lub aktualizacji silnika, próbki, biblioteki albo sposobu renderowania. Docelowe pomysły oznaczaj jako plan, nie jako gotowe funkcje.


## Skrzypce

`/violin` ma dwa silniki. Domyślny eksport używa `python/render_violin.py`, lokalnego FluidSynth 2.5.4 i programu General MIDI 40 z kompletnego banku `app/instruments/violin/generaluser-gs/GeneralUser-GS-v1.471.sf2`. GeneralUser GS v1.471 autorstwa S. Christiana Collinsa pozwala na użycie w projektach programistycznych i produkcji muzycznej; `LICENSE.txt`, `README.txt` i `CHANGELOG.txt` są zachowane obok banku. Poprzedni FreePats GM nie zawierał presetu skrzypiec, więc FluidSynth wracał do programu 0 i faktycznie renderował pianino; ten bank oraz jego archiwum usunięto.

Drugi silnik to deterministyczna synteza Web Audio używana przez interaktywny gryf i opcjonalny eksport w przeglądarce. Sumuje harmoniczne, obwiednię i łagodne vibrato. Renderer próbkowany obsługuje MusicJSON 0.3 w tickach: pitch MIDI, początek, długość, velocity i mapę tempa. Nie interpretuje jeszcze legato, staccato, kierunku/nacisku smyczka, portamento ani parametrów vibrato. Szczegóły: [`../dokumentacja/renderowanie-skrzypiec.md`](../dokumentacja/renderowanie-skrzypiec.md).

## Gitara klasyczna

`/guitar` ma domyślny eksport próbkowany: MusicJSON 0.3 → `python/render_guitar.py` → tymczasowy MIDI → projektowy FluidSynth 2.5.4 + FreePats Spanish classical guitar SF2 → WAV. Python używa biblioteki standardowej. Bank `app/instruments/guitar/freepats-spanish-classical/SpanishClassicalGuitar-SF2-20190618/SpanishClassicalGuitar-20190618.sf2` jest z próbek nagranych w 2008 roku i ma licencję CC0 1.0; oryginalne noty `readme.txt` i `cc0.txt` są obok. Źródło: [FreePats Nylon-String Acoustic Guitar](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html). Archiwum jest w `server/packages/`. Zachowano też syntetyczny eksport WAV oraz syntetyczny interaktywny gryf Web Audio. Gitarowy renderer zachowuje MIDI pitch, velocity, ticki i mapę tempa, lecz nie interpretuje jeszcze palcowania `string`/`fret` ani zaawansowanych artykulacji. Więcej w [`../dokumentacja/renderowanie-gitary.md`](../dokumentacja/renderowanie-gitary.md).

MusicJSON 0.4 dodaje zdarzenia `guitar_percussion` do renderu Python. Uderzenia w pudło i stłumione struny są obecnie modelowane krótkimi deterministycznymi sygnałami PCM, nie bankiem próbek SF2. Eksport syntetyczny w przeglądarce nadal przyjmuje tylko 0.3. Katalog gitary wykrywa instrument po nazwie, więc pojawienie się pliku na liście samo nie oznacza zgodności z każdym silnikiem.

MusicJSON 0.5 może używać `global.tempo_bpm` dla stałego tempa bez mapy. Renderer przelicza BPM na mikrosekundy na ćwierćnutę i renderuje również rozbudowane, niemal pięciominutowe studium `latin_fingerstyle_training_full.json`; dotychczasowe 0.3/0.4 zachowują swoje ścieżki.

## Przepływ dźwięku pianina

```text
app/library/*.json → app/router.php → python/runtime/python.exe
    → python/render_piano.py → tymczasowy MIDI → FluidSynth + wybrany SF2 pianina
    → stereo WAV → odtwarzacz i pobranie w przeglądarce
```

Wybranie „YDP Grand Piano” albo „Kawai Upright KW” na `/piano` uruchamia ten przepływ. Domyślny model `ydp` pozostaje bez zmian; nowy `upright-kw` wybiera drugi lokalny bank SF2. Python używa tylko biblioteki standardowej (`json`, `math`, `pathlib`, `re`, `struct`, `subprocess`, `sys`, `tempfile`, `argparse`); **nie instalowano pakietów pip**. MIDI jest formatem pośrednim tworzonym przez nasz skrypt, a nie osobną biblioteką. PHP zwraca WAV z endpointu `/api/render-piano`. Tymczasowy MIDI i WAV pozostają w `python/output` tylko na czas żądania.

| Składnik | Wersja / położenie | Rola | Stan i uwagi |
|---|---|---|---|
| PHP | 8.2.29, `server/php/` | Lokalny serwer, lista partytur i endpoint renderowania | `start.bat` uruchamia projektowe `php.exe` z `-n`; serwer wystawia wyłącznie `public_html`. |
| Python embeddable, Windows x64 | 3.12.10, `python/runtime/` | Walidacja MusicJSON, utworzenie MIDI i wywołanie renderera | Interpreter lokalny, bez globalnej instalacji; skrypt: `python/render_piano.py`. |
| FluidSynth | 2.5.4, `server/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/` | Offline: MIDI + SoundFont SF2 → WAV | Wywoływany z Pythona jako lokalny program; renderer próbkowy, nie model AI/VST. `-R 0` i `-C 0` wyłączają pogłos i chorus; 44,1 kHz, stereo, 16-bit WAV. Licencja LGPL. |
| YDP Grand Piano SF2 | wydanie 2016-08-04, `app/instruments/piano/ydp-grand-piano/YDP-GrandPiano-SF2-20160804/` | Brzmienie fortepianu z próbek Yamaha Disklavier Pro | Plik `YDP-GrandPiano-20160804.sf2`; oryginalna nota `YDP-GrandPiano-20160804.txt` jest obok. FreePats / Zenph Studios dla OLPC; CC BY 3.0. |
| Upright Piano KW SF2 | wydanie 2022-02-21, `app/instruments/piano/upright-kw/UprightPianoKW-SF2-20220221/` | Drugie brzmienie: pianino stojące Kawai nagrane w pokoju | Plik `UprightPianoKW-20220221.sf2` i oryginalne `readme.txt`, `cc0.txt` obok. FreePats / Gonzalo / Roberto; CC0 1.0. Pełny bank stereo, 2 warstwy velocity. |
| Web Audio API przeglądarki | wersja zależy od przeglądarki | Odsłuch klawiatury (`piano.js`) oraz alternatywny „Podgląd syntetyczny” (`render-piano.js`) | Oscylatory sinusoidalne z harmonicznymi; **nie** wykorzystuje SF2. Wygląd i gra klawiatury pozostały bez zmian. |

Archiwa użytych wydań są w `server/packages/`. Zależności silnika Windows (DLL) są razem z `fluidsynth.exe` w projektowym `bin/`. Żaden z tych plików nie powinien być przenoszony do `public_html` ani pobierany z internetu podczas zwykłego uruchamiania aplikacji.

## Parametry wykonywania i zgodność

- Renderer czyta jedną ścieżkę pianina w starszym MusicJSON 0.1 albo ścieżki rąk w zapisie tickowym MIDI 0.2 lub 0.3. `instrument` z członem `piano` decyduje o umieszczeniu pliku na stronie pianina; wybrany SoundFont (`ydp` lub `upright-kw`) pochodzi z interfejsu, niezależnie od `tracks[].render.engine` i `preset` w JSON.
- `right_hand` i `left_hand` idą na oddzielne kanały MIDI. Suwak balansu działa podczas renderowania; nie zmienia partytury. Wartości skrajne wyciszają przeciwną rękę.
- Suwak „Poziom końcowego WAV” ustawia żądane wzmocnienie od −12 do +12 dB po renderowaniu. Endpoint `/api/piano-level` renderuje wybrany JSON/model/balans bez zapisywania końcowego pliku i mierzy szczyt PCM; ostrzeżenie jest więc osobne dla partytury i brzmienia. Właściwy eksport ogranicza zastosowane wzmocnienie tak, aby szczyt pliku nie przekroczył około −1 dBFS. Nie usuwa to ewentualnego przesterowania powstałego wcześniej w samym FluidSynth.
- `velocity` wpływa na dynamikę i wybór warstwy próbki. Wysokość, początek, długość nuty oraz pojedyncze tempo lub mapa tempa są używane. Dla MusicJSON 0.2 renderer zachowuje oryginalne ticki MIDI, tempo w mikrosekundach na ćwierćnutę i zdarzenia MIDI CC (w tym pedał CC64). CC11 jest zarezerwowane dla suwaka balansu. Wariant syntetyczny w przeglądarce obsługuje tylko format 0.1.
- `articulation`, `mix`, `analysis`, `render` i wskazówki pogłosu w JSON są obecnie metadanymi lub planem; renderer nie realizuje ich jeszcze w pełni. Nie należy obiecywać wykonania staccato, akcentu, pedału czy miksu dB tylko dlatego, że te pola istnieją.
- `app/vocal/` ma wyłącznie szkielet katalogów. Nie ma obecnie syntezy wokalu. OpenUTAU, VST i inne silniki wymienione w wizji nie są zainstalowane ani połączone z aplikacją.

## Pochodzenie i prawa

- Python: [oficjalne wydanie 3.12.10](https://www.python.org/downloads/release/python-31210/).
- FluidSynth: [projekt i licencja](https://github.com/FluidSynth/fluidsynth), lokalnie wersja 2.5.4.
- Próbki fortepianu: [FreePats YDP Grand Piano](https://freepats.zenvoid.org/Piano/YDP-GrandPiano/). Autorstwo i warunki zachowano w oryginalnym pliku `.txt`; licencja [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Zachowaj atrybucję także przy publikacji aplikacji lub plików z próbkami.
- Próbki pianina stojącego: [FreePats Upright Piano KW](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html#UprightKW). Nagrania Gonzalo i Roberto, opracowanie Roberto; oryginalne `readme.txt` i `cc0.txt` znajdują się z SF2. [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

Szczegóły obsługi pianina: [`../dokumentacja/renderowanie-pianina.md`](../dokumentacja/renderowanie-pianina.md). Format danych: [`MUSICJSON.md`](MUSICJSON.md).
