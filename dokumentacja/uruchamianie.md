# Uruchamianie lokalne

Uruchom `start.bat` z katalogu głównego projektu. Skrypt otwiera `http://127.0.0.1:8000` w domyślnej przeglądarce. Okno serwera musi pozostać otwarte; `Ctrl+C` je zatrzymuje.

Skrypt używa wyłącznie `server/php/php.exe`, czyli kopii PHP wewnątrz projektu. PHP startuje z opcją `-n`, bez skopiowanego `php.ini`, którego ścieżki do rozszerzeń wskazują poza projekt i powodowały błędy przy ścieżce z `!`. Obecna aplikacja nie potrzebuje tych rozszerzeń. Serwer nasłuchuje tylko na `127.0.0.1` i wystawia katalog `public_html`. Pozostałe katalogi nie są dostępne bezpośrednio przez HTTP.

Eksport fortepianu próbkowanego używa `python/runtime/python.exe`, `python/render_piano.py`, lokalnego FluidSynth w `server/fluidsynth` i SoundFontu w `app/instruments/piano`. Nie trzeba instalować Pythona ani FluidSynth globalnie. `start.bat` uruchamia PHP, które wywołuje te składniki przy eksporcie. Szczegóły: [`renderowanie-pianina.md`](renderowanie-pianina.md).
