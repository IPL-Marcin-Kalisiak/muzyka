# Dokumentacja AI Orchestra

Projekt jest lokalną aplikacją przeglądarkową do komponowania z kontrolowanej, tekstowej partytury. Dokument wizji: [`../AI_Orchestra_założenia_projektu.md`](../AI_Orchestra_założenia_projektu.md). Ta dokumentacja opisuje faktyczny stan implementacji i będzie rozwijana wraz z projektem.

Pełna, aktualizowana mapa katalogów znajduje się w [`../.agents/STRUCTURE.md`](../.agents/STRUCTURE.md).

Wstępna analiza matematycznych zależności w lokalnych partyturach oraz hipotezy dla przyszłego analizatora: [`matematyka-muzyki.md`](matematyka-muzyki.md).

Wstępna analiza matematycznych zależności w lokalnych partyturach oraz hipotezy dla przyszłego analizatora: [`matematyka-muzyki.md`](matematyka-muzyki.md).

## Ustalona struktura

```text
!!!_MuZyKa_!!!/
├── start.bat                 # start serwera lokalnego
├── public_html/
│   └── index.php            # jedyny publiczny punkt wejścia
├── app/
│   ├── router.php           # kierowanie żądań
│   ├── view/                # widoki przeglądarkowe
│   ├── library/             # partytury JSON
│   ├── instruments/         # podkatalog dla każdego instrumentu
│   └── vocal/               # język / głos, np. pl/Agnieszka
├── server/php/              # lokalny interpreter PHP i serwer wbudowany
├── python/                  # lokalny Python, renderer i wyniki tymczasowe
├── dokumentacja/            # dokumentacja rozwoju
├── AGENTS.md                # instrukcje dla agentów
└── .agents/WORKLOG.md       # zwięzła pamięć pracy
```

Nazwy techniczne `public_html`, `index.php`, `router.php`, `view`, `library`, `instruments` i `vocal` są poprawne. Kody języków `pl`, `es`, `en` odpowiadają polskiemu, hiszpańskiemu i angielskiemu. Nazwy głosów są nazwami własnymi i pozostają dowolne.

## Stan i kierunek

Obecnie działa strona startowa (`/`), strona pianina (`/piano`), lista plików JSON z biblioteki i klawiatura z syntetycznym odsłuchem przez Web Audio. Fotografia pianina i wszystkie zasoby stron są przechowywane lokalnie. Klawiatura nie zapisuje jeszcze partytury. Eksport partytury ma dwa brzmienia: fortepian próbkowany przez lokalny Python i FluidSynth oraz wcześniejszy podgląd syntetyczny w przeglądarce. Nie ma jeszcze edytora ani pełnego schematu partytury. `song.json` pozostaje źródłem prawdy, a serwer działa lokalnie i może pracować offline.

Eksport na stronie `/piano` wykrywa w `app/library` pliki JSON, których `tracks[].instrument` zawiera `piano` (np. `acoustic_grand_piano`). Wyświetla nazwę pliku, tytuł i liczbę nut. Endpointy akceptują tylko nazwy z wykrytej listy. Eksport uwzględnia wysokość nut, początek, długość i velocity. Oba renderery obsługują na razie czas liczony w ósemkach; nie modelują osobno artykulacji `legato`. WAV można odsłuchać i pobrać pod nazwą partytury.

Szczegóły lokalnego silnika, zasobów i licencji: [`renderowanie-pianina.md`](renderowanie-pianina.md).

Strona `/guitar` ma interaktywny gryf oraz eksport gitarowego MusicJSON 0.3. Domyślny WAV korzysta z lokalnego Pythona, FluidSynth i próbek FreePats Spanish classical guitar; wcześniejszy model syntetyczny można wybrać do porównania. Gryf pozostaje syntetycznym podglądem. Szczegóły i ograniczenia: [`renderowanie-gitary.md`](renderowanie-gitary.md).

Przed generowaniem WAV można ustawić balans lewej i prawej ręki. Pozycja środkowa wyrównuje średnią kwadratową velocity obu głosów, zachowując różnice dynamiki między nutami w obrębie każdej ręki. Ruch w lewo wycisza prawą rękę, ruch w prawo wycisza lewą; skrajne położenia pozostawiają tylko jedną rękę. Ustawienie zmienia wyłącznie wynik renderowania — źródłowy JSON i odsłuch klawiatury pozostają bez zmian. Po pierwszym wygenerowaniu WAV zmiana suwaka automatycznie przygotowuje nowy odsłuch i plik do pobrania po puszczeniu suwaka; odtwarzanie nowej wersji uruchamia się przyciskiem w odtwarzaczu.
