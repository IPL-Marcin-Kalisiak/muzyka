# Struktura projektu AI Orchestra

Stan: 2026-09-13. Ten plik jest **główną mapą katalogów**. Aktualizuj go, gdy dodajesz, przenosisz lub zmieniasz przeznaczenie katalogu bądź istotnego pliku. Opisuj stan istniejący osobno od planowanego. Ścieżki są względne wobec `C:\!!!_MuZyKa_!!!`.

## Aktualna struktura

```text
!!!_MuZyKa_!!!/
├── .agents/
│   ├── STRUCTURE.md                  # główna mapa struktury i zasad porządku
│   ├── WORKLOG.md                    # chronologiczny zapis pracy i decyzji
│   ├── INSTRUMENT_ENGINES.md         # rejestr silników, bibliotek i próbek instrumentów
│   └── MUSICJSON.md                  # opis formatów 0.1 i 0.2 oraz przyszłego schematu
├── AGENTS.md                         # wytyczne obowiązujące agentów
├── .gitignore                        # pomija wyniki tymczasowe, cache i pliki edytorów
├── AI_Orchestra_założenia_projektu.md # wizja i założenia produktu
├── start.bat                         # uruchomienie lokalnego PHP i otwarcie strony
├── public_html/                      # jedyny katalog wystawiony przez HTTP
│   ├── index.php                     # punkt wejścia, ładuje app/router.php
│   └── assets/
│       ├── css/style.css             # wspólna oprawa wizualna
│       ├── js/piano.js               # odsłuch klawiatury przez Web Audio
│       ├── js/guitar.js              # syntetyczny odsłuch gryfu
│       ├── js/render-guitar.js       # wybór próbkowanego lub syntetycznego WAV
│       ├── js/render-piano.js        # wybór renderera WAV: Python lub przeglądarka
│       ├── images/grand-piano.png    # wygenerowana fotografia pianina
│       └── images/classical-guitar.png # wygenerowana fotografia gitary
├── app/                              # kod i dane po stronie serwera
│   ├── router.php                    # obsługa ścieżek i wybór widoku
│   ├── library_catalog.php           # wykrywanie partytur pianina po JSON
│   ├── guitar_catalog.php            # wykrywanie partytur gitary po JSON
│   ├── view/
│   │   ├── home.php                  # strona startowa
│   │   ├── piano.php                 # pierwsza strona pianina
│   │   └── guitar.php                # strona gitary klasycznej
│   ├── library/
│   │   ├── .gitkeep
│   │   ├── fur_elise_piano.json      # prototyp partytury pianina od użytkownika
│   │   ├── fur_elise_piano_v2.json   # druga wersja partytury od użytkownika
│   │   ├── fur_elise_variation_01.json # wariacja partytury pianina
│   │   ├── in_the_hall_of_the_mountain_king_piano.json # utwór z mapą tempa
│   │   ├── in_the_hall_of_the_mountain_king_original_from_midi.json # konwersja MIDI 0.2
│   │   ├── in_the_hall_of_the_mountain_king_classical_guitar.json # aranżacja gitary 0.3
│   │   ├── despacito_full_solo_guitar.json # gitarowy MusicJSON 0.4; fragment źródłowego MIDI
│   │   ├── latin_fingerstyle_training_full.json # rozbudowane studium gitary 0.5
│   │   ├── MIDI/Luis-Fonsi-Despacito.mid # dostarczony plik źródłowy
│   │   └── vivaldi_spring_allegro_piano.json # partytura pianina 0.3 w tickach MIDI
│   ├── instruments/
│   │   ├── piano/.gitkeep            # zasoby pianina
│   │   ├── piano/ydp-grand-piano/    # próbki Yamaha Disklavier Pro, SF2 i nota CC BY 3.0
│   │   ├── piano/upright-kw/         # próbki Kawai Upright KW SF2, nota CC0
│   │   ├── guitar/freepats-spanish-classical/ # próbki SF2 gitary, nota CC0
│   │   └── violin/.gitkeep           # zasoby skrzypiec
│   └── vocal/
│       ├── pl/
│       │   ├── Agnieszka/.gitkeep    # przyszłe zasoby polskiego głosu
│       │   └── Marcin/.gitkeep       # przyszłe zasoby polskiego głosu
│       ├── es/.gitkeep               # miejsce na głosy hiszpańskie
│       └── en/.gitkeep               # miejsce na głosy angielskie
├── server/
│   ├── php/                          # lokalna kopia PHP wraz z bibliotekami
│   ├── fluidsynth/                   # lokalny silnik FluidSynth 2.5.4
│   └── packages/                     # archiwa źródłowe lokalnych runtime i SF2
├── python/
│   ├── runtime/                      # lokalny Python 3.12.10 embeddable
│   ├── render_piano.py              # MusicJSON → MIDI → próbkowany WAV
│   ├── render_guitar.py             # MusicJSON 0.3 → MIDI → próbkowany WAV gitary
│   └── output/                       # krótkotrwałe pliki renderowania
└── dokumentacja/
    ├── README.md                     # dokumentacja produktu i aktualnego stanu
    ├── uruchamianie.md               # instrukcja uruchomienia
    ├── renderowanie-pianina.md       # silnik, ograniczenia, licencje
    ├── renderowanie-gitary.md        # silnik gitary, ograniczenia, licencja
    └── matematyka-muzyki.md          # pomiary partytur i hipotezy analizy
```

Katalog `server/php` zawiera kompletną lokalną kopię dystrybucji PHP (w tym `php.exe`, `php.ini`, `ext/` i biblioteki zależne). Jej pliki wewnętrzne nie są rozpisane w mapie, ponieważ należą do dostarczonego środowiska, a nie do kodu AI Orchestra.

## Reguły lokalizacji

- `public_html/`: publiczny punkt wejścia i zasoby statyczne przeznaczone do pobrania przez przeglądarkę. Nie umieszczaj tu prywatnych partytur, głosów ani kodu renderującego.
- `app/view/`: szablony interfejsu. Logika routingu pozostaje w `app/router.php`; w miarę rozwoju wydzielaj ją do odpowiednich modułów w `app/`.
- `app/library/`: projekty i partytury JSON. `song.json` jest źródłem prawdy; nie traktuj wyeksportowanego MIDI ani WAV jako partytury źródłowej. `app/library_catalog.php` wykrywa pliki JSON ze ścieżką pianina; strona `/piano` pokazuje je automatycznie, a `/api/piano-score?file=...` udostępnia tylko wybrany plik z tej listy. Bezpośredni dostęp HTTP do `app/library` pozostaje zamknięty.
- `app/instruments/<instrument>/`: zasoby i konfiguracja określonego instrumentu. Nazwy instrumentów powinny być krótkie i konsekwentne, np. `piano`, `violin`.
- `app/vocal/<język>/<głos>/`: zasoby głosu. Używaj kodów języków `pl`, `es`, `en`; nazwy głosów są nazwami własnymi. Obecne katalogi głosów są puste i nie oznaczają zaimplementowanej syntezy.
- `server/`: składniki lokalnego serwera, uruchamiane przez `start.bat` bez zależności od globalnego PHP.
- `python/`: lokalny interpreter i kod renderujący. `output` przechowuje wyłącznie pliki tymczasowe podczas żądania.
- `dokumentacja/`: trwała dokumentacja tworzenia, działania i decyzji technicznych. `.agents/` przechowuje instrukcje, pamięć pracy, rejestr silników i opis formatu danych; w `WORKLOG.md` zapisuj tylko zwięzły ślad zmian.

## Planowane, jeszcze nieistniejące elementy

Pełny schemat `song.json`, edytor partytury w przeglądarce i publiczny eksport MIDI. Klawiatura nadal używa podglądu Web Audio; eksport WAV ma już wariant z próbkowanego pianina. Nazwy planowanych plików i dokładne położenie ustal przy implementacji, następnie zaktualizuj tę mapę.
