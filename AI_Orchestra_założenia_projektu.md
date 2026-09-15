# Projekt: lokalne studio muzyczne sterowane partyturą JSON

## 1. Geneza pomysłu

Punktem wyjścia nie jest klasyczny generator muzyki AI typu „podaj prompt i wygeneruj gotową piosenkę”.

Założenie jest inne:

- człowiek komponuje utwór,
- człowiek decyduje o melodii, harmonii, instrumentach i strukturze,
- system nie ma zastępować kompozytora,
- AI oraz oprogramowanie mają pełnić rolę **wykonawców, aranżerów pomocniczych i narzędzi edycyjnych**,
- utwór powinien istnieć w postaci jednoznacznego, tekstowego opisu,
- całość powinna działać **lokalnie i offline**,
- wynik ma być renderowany do plików audio, bez konieczności pracy w czasie rzeczywistym.

W praktyce system ma przypominać cyfrową orkiestrę, której przekazuje się nuty i instrukcje wykonawcze.

Każdy instrument otrzymuje własną ścieżkę. System następnie renderuje poszczególne partie i składa je w gotowy utwór.

---

# 2. Główna idea projektu

Centralnym elementem projektu jest plik:

```text
song.json
```

Plik JSON pełni rolę **maszynowej partytury źródłowej**.

Nie musi zastępować klasycznego zapisu nutowego dla człowieka. Jego zadaniem jest opisanie utworu w sposób:

- jednoznaczny,
- łatwy do edycji,
- możliwy do generowania przez program,
- łatwy do wersjonowania w Git,
- możliwy do modyfikowania przez lokalny model AI,
- niezależny od konkretnego programu muzycznego.

Schemat działania:

```text
                    song.json
                        │
                        │
              parser / orchestrator
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
     piano           violin           vocal
        │               │                │
        ▼               ▼                ▼
    MIDI/VST         MIDI/VST      singing engine
        │               │                │
        ▼               ▼                ▼
   piano.wav       violin.wav       vocal.wav
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                       MIX
                        ▼
                   final_song.wav
```

---

# 3. Najważniejsza zasada

## AI nie komponuje za człowieka

Podstawowym założeniem jest:

> AI nie ma być autorem utworu. AI ma być muzykiem wykonującym zapisane instrukcje.

Przykładowe polecenia:

- „od taktu 16 skrzypce grają oktawę wyżej”,
- „zmniejsz dynamikę fortepianu w drugiej zwrotce”,
- „dodaj wiolonczelę od refrenu”,
- „wokal w tym fragmencie ma być bardziej delikatny”,
- „zwiększ vibrato na długiej nucie”,
- „dodaj drugi głos tercję wyżej”,
- „zmniejsz velocity pianina w taktach 8–12”.

Lokalny model AI mógłby w przyszłości tłumaczyć takie polecenia na zmiany w `song.json`.

---

# 4. Dlaczego JSON

JSON jest dobrym formatem pośrednim, ponieważ:

- jest prosty,
- jest czytelny dla człowieka,
- bardzo dobrze obsługuje go Python,
- praktycznie każdy język programowania może go odczytać,
- można łatwo przechowywać go w Git,
- można porównywać wersje,
- można walidować strukturę przez JSON Schema,
- model językowy może go łatwo modyfikować,
- pozwala przechowywać znacznie więcej informacji niż zwykły MIDI.

MIDI pozostaje bardzo użyteczne, ale bardziej jako **format wykonawczy** niż główny format projektu.

Docelowo:

```text
JSON = źródło prawdy o utworze
MIDI = format pośredni / wykonawczy
WAV = wynik renderowania
```

---

# 5. Proponowana struktura pliku song.json

Przykład:

```json
{
  "project": {
    "title": "Untitled",
    "author": "MikiMouse",
    "version": "0.1"
  },

  "global": {
    "tempo": 80,
    "time_signature": "4/4",
    "key": "C major",
    "sample_rate": 48000
  },

  "tracks": [
    {
      "id": "piano_01",
      "instrument": "piano",
      "engine": "vst",
      "notes": []
    },

    {
      "id": "violin_01",
      "instrument": "violin",
      "engine": "vst",
      "notes": []
    },

    {
      "id": "vocal_01",
      "instrument": "vocal",
      "engine": "singing_synth",
      "notes": []
    }
  ]
}
```

---

# 6. Pojedyncza nuta instrumentu

Najprostszy zapis:

```json
{
  "pitch": "C4",
  "start": 0.0,
  "duration": 1.0,
  "velocity": 72
}
```

Można następnie rozszerzyć go o informacje wykonawcze:

```json
{
  "pitch": "G4",
  "start": 4.0,
  "duration": 2.0,
  "velocity": 58,
  "articulation": "legato",
  "vibrato": 0.35,
  "expression": "soft",
  "timing_offset_ms": -10
}
```

---

# 7. Parametry muzyczne możliwe do zapisania w JSON

Potencjalnie można przechowywać:

## Parametry nuty

- wysokość,
- oktawę,
- czas rozpoczęcia,
- długość,
- velocity,
- głośność,
- velocity release,
- timing offset.

## Artykulacja

- legato,
- staccato,
- marcato,
- tenuto,
- pizzicato,
- tremolo,
- spiccato,
- sustain.

## Ekspresja

- vibrato,
- crescendo,
- diminuendo,
- accent,
- dynamics,
- expression curve.

## Parametry ścieżki

- instrument,
- biblioteka brzmienia,
- kanał MIDI,
- panorama,
- głośność,
- reverb,
- EQ,
- routing.

---

# 8. Przykład ścieżki pianina

```json
{
  "id": "piano_01",
  "instrument": "piano",
  "notes": [
    {
      "pitch": "C4",
      "start": 0,
      "duration": 1,
      "velocity": 72
    },
    {
      "pitch": "E4",
      "start": 0,
      "duration": 1,
      "velocity": 70
    },
    {
      "pitch": "G4",
      "start": 0,
      "duration": 1,
      "velocity": 74
    }
  ]
}
```

Tak można opisać akord C-dur.

---

# 9. Przykład ścieżki skrzypiec

```json
{
  "id": "violin_01",
  "instrument": "violin",
  "notes": [
    {
      "pitch": "G4",
      "start": 0,
      "duration": 2,
      "velocity": 55,
      "articulation": "legato",
      "vibrato": 0.4
    },
    {
      "pitch": "A4",
      "start": 2,
      "duration": 2,
      "velocity": 60,
      "articulation": "legato",
      "vibrato": 0.45
    }
  ]
}
```

---

# 10. Wokal

Wokal jest trudniejszy niż klasyczne instrumenty, ale jest wykonalny.

Silnik wokalny musi otrzymać:

- melodię,
- rytm,
- długość nut,
- tekst,
- sylaby lub fonemy,
- ewentualne parametry ekspresji.

Przykład:

```json
{
  "id": "vocal_01",
  "instrument": "vocal",
  "voice": "female_01",

  "notes": [
    {
      "pitch": "C4",
      "start": 0.0,
      "duration": 0.5,
      "lyric": "Kie"
    },
    {
      "pitch": "D4",
      "start": 0.5,
      "duration": 0.5,
      "lyric": "dy"
    },
    {
      "pitch": "E4",
      "start": 1.0,
      "duration": 1.0,
      "lyric": "cię"
    }
  ]
}
```

---

# 11. Wokal – możliwe rozwinięcie formatu

Docelowo:

```json
{
  "pitch": "A4",
  "start": 12.0,
  "duration": 1.5,

  "lyric": "świat",

  "phonemes": [
    "ś",
    "f",
    "j",
    "a",
    "t"
  ],

  "expression": {
    "style": "soft",
    "breathiness": 0.25,
    "vibrato": 0.18,
    "tension": 0.30
  }
}
```

Nie wszystkie silniki wokalne przyjmą takie parametry bezpośrednio.

Translator projektu będzie więc odpowiadał za zamianę własnego formatu na format wymagany przez konkretny syntezator.

---

# 12. Możliwe silniki wokalne

Rozważane rozwiązania:

## OpenUTAU

Zalety:

- open source,
- działa lokalnie,
- nadaje się do eksperymentowania,
- posiada własny format projektu,
- można budować automatyczne translatory.

Możliwa ścieżka:

```text
MusicJSON
   ↓
Python
   ↓
USTX
   ↓
OpenUTAU
   ↓
WAV
```

## Synthesizer V

Bardziej zaawansowany silnik wokalny.

Możliwa ścieżka:

```text
MusicJSON
   ↓
translator
   ↓
SVP
   ↓
Synthesizer V
   ↓
WAV
```

Istotne jest to, że projekt nie powinien być uzależniony od jednego silnika.

---

# 13. Abstrakcja silników wykonawczych

Każda ścieżka może mieć określony renderer:

```json
{
  "instrument": "piano",
  "renderer": "midi_vst"
}
```

lub:

```json
{
  "instrument": "vocal",
  "renderer": "openutau"
}
```

lub w przyszłości:

```json
{
  "instrument": "vocal",
  "renderer": "synthesizer_v"
}
```

Dzięki temu system pozostaje modułowy.

---

# 14. Instrumenty

Pierwsza wersja projektu może obsługiwać:

1. pianino,
2. skrzypce,
3. wokal.

Później:

- gitara,
- gitara basowa,
- wiolonczela,
- altówka,
- kontrabas,
- perkusja,
- instrumenty dęte,
- pełna orkiestra.

---

# 15. Format pośredni MIDI

Dla klasycznych instrumentów najłatwiejszym rozwiązaniem będzie:

```text
JSON
 ↓
Python
 ↓
MIDI
 ↓
VST / sampler
 ↓
WAV
```

Python może wygenerować plik MIDI na podstawie danych JSON.

MIDI zawiera między innymi:

- note on,
- note off,
- velocity,
- kanał,
- kontrolery,
- tempo.

---

# 16. Dlaczego nie tylko MIDI

MIDI jest bardzo przydatny, ale ma ograniczenia.

Trudniej opisać w nim semantycznie:

- emocję,
- typ artykulacji,
- strukturę utworu,
- tekst,
- sylaby,
- fonemy,
- intencję wykonawczą,
- metadane,
- zależności między ścieżkami.

JSON może więc być bogatszym formatem źródłowym.

---

# 17. Renderowanie offline

Projekt ma działać przede wszystkim **offline**.

Nie trzeba odtwarzać całej orkiestry w czasie rzeczywistym.

System może renderować:

```text
piano → piano.wav
violin → violin.wav
vocal → vocal.wav
```

a następnie:

```text
piano.wav
violin.wav
vocal.wav
     ↓
    MIX
     ↓
song.wav
```

---

# 18. Zaleta renderowania offline

Słabszy komputer nie jest zasadniczym problemem.

Jeśli utwór trwa 4 minuty, renderowanie może trwać:

- 30 sekund,
- 4 minuty,
- 10 minut,
- 30 minut.

Nie ma to większego znaczenia, ponieważ program nie musi zachować pracy w czasie rzeczywistym.

Kluczowe jest tylko otrzymanie poprawnego pliku końcowego.

---

# 19. Renderowanie instrument po instrumencie

Jeszcze lepszym rozwiązaniem dla słabszego sprzętu jest sekwencyjne renderowanie.

Przykład:

```text
1. Załaduj pianino
2. Renderuj piano.wav
3. Zwolnij pamięć

4. Załaduj skrzypce
5. Renderuj violin.wav
6. Zwolnij pamięć

7. Załaduj wokal
8. Renderuj vocal.wav
9. Zwolnij pamięć

10. Wykonaj miks
```

Dzięki temu:

- nie trzeba ładować wszystkich bibliotek do RAM jednocześnie,
- wymagania sprzętowe maleją,
- można pracować na przeciętnym komputerze,
- renderowanie może odbywać się w tle lokalnie.

---

# 20. Założenie: pełna praca offline

Docelowe założenie:

> Po zainstalowaniu potrzebnego oprogramowania i modeli cały proces tworzenia i renderowania muzyki może odbywać się bez Internetu.

Internet może być potrzebny jedynie do:

- pobrania programów,
- pobrania bibliotek instrumentów,
- pobrania modeli wokalnych,
- ewentualnej aktywacji licencji.

Sam projekt:

```text
komponowanie
edycja
AI
renderowanie
miks
eksport
```

powinien działać lokalnie.

---

# 21. Lokalny AI

W przyszłości do projektu można dołączyć lokalny model językowy.

Jego rolą nie byłoby generowanie audio.

Model działałby jako **inteligentny edytor partytury**.

Przykład:

Użytkownik mówi:

> Od taktu 16 skrzypce mają grać oktawę wyżej.

Model:

1. odczytuje `song.json`,
2. znajduje ścieżkę skrzypiec,
3. znajduje odpowiedni fragment,
4. podnosi wysokość nut o 12 półtonów,
5. zapisuje zmieniony JSON.

---

# 22. AI jako dyrygent / asystent

Możliwe polecenia:

```text
Zagraj refren ciszej.

Dodaj drugie skrzypce.

Usuń pianino z pierwszych czterech taktów.

Przenieś melodię o ton wyżej.

Dodaj crescendo przed refrenem.

Zrób wokal bardziej delikatny.

Dodaj chór w ostatnim refrenie.

Spraw, żeby wiolonczela grała podstawy akordów.
```

AI zamienia polecenia języka naturalnego na modyfikacje struktury projektu.

---

# 23. Możliwa architektura aplikacji

```text
┌─────────────────────────────┐
│           GUI / CLI         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        MusicJSON Core       │
│          song.json          │
└──────────────┬──────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
   AI Editor       Validator
        │
        └──────┬───────┘
               ▼
         Render Manager
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
   MIDI       VST      Vocal
 Renderer   Renderer   Renderer
      │        │        │
      ▼        ▼        ▼
     WAV      WAV      WAV
       \       │       /
        \      │      /
         └─────┼─────┘
               ▼
              MIX
               ▼
          MASTER WAV
```

---

# 24. Możliwe technologie

## Język

Python.

Powody:

- szybki rozwój,
- dobre biblioteki MIDI,
- JSON jest obsługiwany natywnie,
- łatwa integracja z AI,
- łatwe operacje na audio,
- duża liczba bibliotek.

---

# 25. Przykładowe biblioteki Python

Potencjalnie:

- `mido`
- `pretty_midi`
- `music21`
- `pydub`
- `soundfile`
- `numpy`

Nie trzeba używać ich wszystkich.

Pierwszy prototyp może wymagać jedynie:

```text
Python
JSON
mido
```

---

# 26. Minimalny MVP

Pierwsza działająca wersja powinna być bardzo mała.

## MVP 0.1

Jedna ścieżka:

```text
song.json
 ↓
Python
 ↓
piano.mid
```

Cel:

> JSON poprawnie tworzy plik MIDI.

---

# 27. MVP 0.2

```text
song.json
 ↓
piano.mid
 ↓
wirtualne pianino
 ↓
piano.wav
```

Cel:

> komputer wykonuje naszą partię pianina.

---

# 28. MVP 0.3

Dodajemy skrzypce:

```text
song.json
   │
   ├── piano.mid
   └── violin.mid
```

Render:

```text
piano.wav
violin.wav
```

---

# 29. MVP 0.4

Dodajemy wokal.

```text
song.json
 ↓
vocal track
 ↓
translator
 ↓
OpenUTAU / inny singing engine
 ↓
vocal.wav
```

---

# 30. MVP 0.5

Automatyczny miks:

```text
piano.wav
violin.wav
vocal.wav
    ↓
  mixer
    ↓
demo.wav
```

W tym momencie powstaje pierwszy pełny utwór.

---

# 31. Przykładowy pierwszy eksperyment

Nie należy zaczynać od pełnej orkiestry.

Pierwszy utwór:

- 8 taktów,
- 4/4,
- 70–90 BPM,
- pianino,
- skrzypce,
- jeden wokal,
- prosty tekst.

Cel nie brzmi:

> stworzyć piękny utwór.

Cel brzmi:

> udowodnić, że jeden JSON może sterować pianinem, skrzypcami i wokalem oraz wygenerować końcowy plik WAV.

---

# 32. Możliwa struktura katalogów projektu

```text
AI-Orchestra/
│
├── project/
│   └── song.json
│
├── src/
│   ├── parser.py
│   ├── validator.py
│   ├── midi_renderer.py
│   ├── vocal_renderer.py
│   ├── mixer.py
│   └── render_manager.py
│
├── midi/
│   ├── piano.mid
│   └── violin.mid
│
├── stems/
│   ├── piano.wav
│   ├── violin.wav
│   └── vocal.wav
│
├── output/
│   └── song.wav
│
└── schemas/
    └── musicjson.schema.json
```

---

# 33. Walidacja JSON

Warto stworzyć `musicjson.schema.json`.

Przykładowe zasady:

- `tempo` musi być większe od 0,
- każda nuta musi mieć `pitch`,
- każda nuta musi mieć `duration > 0`,
- `velocity` mieści się w zakresie 0–127,
- każda ścieżka ma unikalne ID,
- wokal musi mieć tekst lub fonemy,
- czas rozpoczęcia nuty nie może być ujemny.

---

# 34. Wersjonowanie

JSON daje ciekawą możliwość pracy z Git.

Przykład historii:

```text
v0.1 – pianino
v0.2 – dodane skrzypce
v0.3 – zmiana refrenu
v0.4 – dodany wokal
v0.5 – zmiana dynamiki
```

Można dokładnie zobaczyć:

```diff
- "velocity": 72
+ "velocity": 58
```

czy:

```diff
- "pitch": "G4"
+ "pitch": "G5"
```

---

# 35. Format własny a standardy

Nie ma sensu próbować zastępować istniejących formatów muzycznych.

Projekt powinien potrafić eksportować lub importować:

- MIDI,
- MusicXML,
- potencjalnie formaty konkretnego syntezatora wokalnego.

Architektura:

```text
               MusicXML
                  ↑
                  │
MIDI ←────── MusicJSON ─────→ USTX
                  │
                  ↓
                 SVP
```

MusicJSON jest warstwą abstrakcji.

---

# 36. Możliwy import klasycznej partytury

W przyszłości:

```text
MusicXML
 ↓
importer
 ↓
MusicJSON
```

Dzięki temu utwór zapisany w MuseScore można byłoby zaimportować do systemu.

---

# 37. Możliwy eksport do klasycznej partytury

Analogicznie:

```text
MusicJSON
 ↓
MusicXML
 ↓
MuseScore
 ↓
PDF
```

Można więc stworzyć zarówno:

- plik audio,
- MIDI,
- jak i klasyczną partyturę PDF.

---

# 38. Największe problemy techniczne

## 38.1 Naturalność instrumentów

Sama poprawna nuta nie wystarczy.

Naturalne wykonanie wymaga:

- dynamiki,
- artykulacji,
- zmian tempa,
- mikroprzesunięć,
- odpowiednich bibliotek próbek.

---

# 39. Humanizacja

Idealnie równe MIDI brzmi sztucznie.

System powinien pozwalać na niewielkie odchylenia:

```json
{
  "humanize": {
    "timing_ms": 8,
    "velocity": 4
  }
}
```

---

# 40. Tempo map

Tempo nie musi być stałe.

Przykład:

```json
{
  "tempo_map": [
    {
      "bar": 1,
      "bpm": 80
    },
    {
      "bar": 16,
      "bpm": 84
    },
    {
      "bar": 32,
      "bpm": 76
    }
  ]
}
```

---

# 41. Struktura utworu

Można również przechowywać sekcje:

```json
{
  "sections": [
    {
      "name": "intro",
      "start_bar": 1,
      "end_bar": 4
    },
    {
      "name": "verse_1",
      "start_bar": 5,
      "end_bar": 12
    },
    {
      "name": "chorus",
      "start_bar": 13,
      "end_bar": 20
    }
  ]
}
```

Dzięki temu można wydawać polecenia:

> Zmień drugi refren.

zamiast:

> Zmień takty 37–44.

---

# 42. Harmonia

W przyszłości warto opisać także akordy:

```json
{
  "harmony": [
    {
      "bar": 1,
      "chord": "C"
    },
    {
      "bar": 2,
      "chord": "Am"
    },
    {
      "bar": 3,
      "chord": "F"
    },
    {
      "bar": 4,
      "chord": "G"
    }
  ]
}
```

Ułatwi to później:

- generowanie basu,
- harmonizację wokalu,
- analizę utworu,
- transpozycję.

---

# 43. Transpozycja

Ponieważ muzyka istnieje jako dane strukturalne, można łatwo wykonać:

```text
transpozycja +2 półtony
```

dla:

- całego utworu,
- pojedynczej ścieżki,
- wybranego fragmentu.

---

# 44. Wokal – największe wyzwanie

Najtrudniejszym elementem projektu będzie najprawdopodobniej wokal.

Problemem nie jest samo wygenerowanie wysokości dźwięku.

Trudniejsze są:

- fonemy,
- podział słów na sylaby,
- naturalne łączenie sylab,
- akcent językowy,
- długość samogłosek,
- spółgłoski,
- vibrato,
- oddech,
- ekspresja.

Szczególnym wyzwaniem może być naturalny język polski.

---

# 45. Możliwe podejście do polskiego wokalu

Warstwa tekstowa:

```text
tekst
 ↓
podział na sylaby
 ↓
fonemizacja
 ↓
dopasowanie fonemów do nut
 ↓
silnik wokalny
```

Przykład:

```text
„kocham cię”
```

może zostać zamienione na strukturę wokalną powiązaną z nutami.

Nie trzeba jednak rozwiązywać tego problemu w pierwszej wersji projektu.

---

# 46. Możliwy interfejs programu

Pierwsza wersja może być CLI:

```bash
python render.py song.json
```

Program wykonuje:

```text
Loading song.json
Validating project...
Rendering piano...
Rendering violin...
Rendering vocal...
Mixing...
Done.

output/song.wav
```

---

# 47. Późniejszy GUI

Dopiero później można stworzyć aplikację:

```text
┌─────────────────────────────────┐
│ AI Orchestra                    │
├──────────────┬──────────────────┤
│ Tracks       │ Timeline         │
│              │                  │
│ Piano        │ █████████████    │
│ Violin       │     █████████    │
│ Vocal        │       ███████    │
│              │                  │
├──────────────┴──────────────────┤
│ Ask AI:                         │
│ "Skrzypce ciszej w refrenie"    │
├─────────────────────────────────┤
│ [Render] [Play] [Export]        │
└─────────────────────────────────┘
```

---

# 48. Filozofia projektu

Projekt różni się od typowych generatorów muzyki AI.

Typowy generator:

```text
PROMPT
 ↓
MODEL
 ↓
GOTOWA PIOSENKA
```

Tutaj:

```text
CZŁOWIEK
 ↓
PARTYTURA
 ↓
AI / SOFTWARE
 ↓
WYKONANIE
```

Kontrola pozostaje po stronie autora.

---

# 49. Najważniejsze potencjalne zalety

1. Pełna kontrola nad kompozycją.
2. Możliwość pracy offline.
3. Brak zależności od usług chmurowych.
4. Możliwość wersjonowania utworu.
5. Możliwość poprawienia pojedynczej nuty.
6. Możliwość wymiany jednego instrumentu bez generowania wszystkiego od nowa.
7. Możliwość renderowania na słabszym sprzęcie.
8. Modułowość.
9. Możliwość użycia różnych silników wokalnych.
10. Możliwość użycia lokalnego AI tylko jako asystenta.

---

# 50. Istotna różnica względem generatorów typu „AI song”

Jeśli generator AI zrobi nieprawidłową nutę lub źle zaśpiewa jedno słowo, często trzeba wygenerować większy fragment ponownie.

W systemie strukturalnym można zmienić:

```json
{
  "pitch": "F4"
}
```

na:

```json
{
  "pitch": "F#4"
}
```

i ponownie wyrenderować tylko jedną ścieżkę.

---

# 51. Stem-based workflow

Każdy instrument powinien generować osobny stem:

```text
01_piano.wav
02_violin.wav
03_cello.wav
04_bass.wav
05_drums.wav
06_vocal.wav
```

Dopiero potem następuje miks.

To pozwala:

- zmieniać głośność,
- stosować EQ,
- dodawać reverb,
- zmieniać panoramę,
- poprawiać tylko jeden instrument.

---

# 52. Render manager

Warto stworzyć centralny moduł:

```text
RenderManager
```

Jego zadania:

1. odczytać projekt,
2. sprawdzić zależności,
3. wygenerować MIDI,
4. uruchomić odpowiednie renderery,
5. zebrać WAV,
6. wykonać miks,
7. zapisać finalny plik.

---

# 53. Cache

Później można dodać cache.

Jeśli pianino nie zostało zmienione:

```text
piano.wav
```

nie trzeba renderować ponownie.

Przykład:

```text
piano     unchanged → use cache
violin    changed   → render
vocal     unchanged → use cache
```

To może bardzo przyspieszyć pracę.

---

# 54. Local-first

Jedno z kluczowych założeń projektu:

> Local-first.

Czyli:

- utwory są na komputerze użytkownika,
- audio jest generowane lokalnie,
- projekt nie wymaga konta,
- nie wymaga przesyłania tekstów piosenek na zewnętrzne serwery,
- dane autora pozostają lokalnie.

---

# 55. Brak potrzeby mocnej karty graficznej w pierwszym MVP

Pierwsza wersja systemu nie wymaga GPU do:

- JSON,
- MIDI,
- pianina,
- klasycznych samplerów,
- miksowania WAV.

GPU może być przydatne później dla:

- lokalnych modeli językowych,
- neural singing synthesis,
- bardziej zaawansowanego AI audio.

Nie jest jednak konieczne do udowodnienia głównej koncepcji.

---

# 56. Minimalny cel techniczny

Najważniejszy eksperyment:

```text
song.json
 ↓
render
 ↓
song.wav
```

gdzie `song.wav` zawiera:

- pianino,
- skrzypce,
- wokal.

Jeżeli ten pipeline działa, podstawowa koncepcja projektu jest potwierdzona.

---

# 57. Potencjalna nazwa robocza formatu

Przykładowe nazwy:

- MusicJSON
- ScoreJSON
- OrchestraJSON
- SongJSON
- OpenScore
- AI Orchestra Format
- MScore

Na początku wystarczy po prostu:

```text
song.json
```

Nie ma potrzeby wybierania nazwy produktu na tym etapie.

---

# 58. Proponowana kolejność prac

## Etap 1
Zaprojektować minimalny format JSON.

## Etap 2
Napisać parser Python.

## Etap 3
JSON → MIDI.

## Etap 4
Wyrenderować pianino.

## Etap 5
Dodać drugi instrument.

## Etap 6
Dodać wokal.

## Etap 7
Automatyczny miks.

## Etap 8
Walidacja JSON.

## Etap 9
Import / eksport MusicXML.

## Etap 10
Lokalny AI edytujący partyturę.

## Etap 11
GUI.

---

# 59. Czego nie robić na początku

Nie warto od razu:

- budować własnego neuralnego syntezatora wokalu,
- robić pełnego DAW,
- budować własnego VST,
- robić pełnej orkiestry symfonicznej,
- tworzyć GUI,
- implementować setek parametrów,
- pisać własnego formatu nutowego dla człowieka.

Najpierw trzeba udowodnić pipeline.

---

# 60. Pierwszy realny kamień milowy

Pierwszy kamień milowy:

> Plik JSON zawierający osiem taktów pianina zostaje przez program zamieniony na plik MIDI i poprawnie odtworzony przez lokalny instrument.

Drugi:

> Do projektu dodane zostają skrzypce.

Trzeci:

> Do projektu dodany zostaje syntetyczny wokal.

Czwarty:

> Całość jest automatycznie renderowana do jednego WAV.

---

# 61. Docelowa wizja

Docelowo użytkownik mógłby napisać:

```text
Otwórz projekt.

W drugim refrenie:
- pianino ciszej,
- dodaj wiolonczelę,
- skrzypce oktawę wyżej,
- wokal bardziej delikatny.

W ostatnim refrenie dodaj drugi głos tercję wyżej.

Renderuj.
```

Lokalny AI:

1. interpretuje polecenie,
2. modyfikuje `song.json`,
3. waliduje projekt,
4. renderuje zmienione ścieżki,
5. wykonuje miks,
6. zapisuje nową wersję.

---

# 62. Najkrótsze podsumowanie projektu

Projekt można streścić jednym zdaniem:

> Lokalna cyfrowa orkiestra, w której człowiek zapisuje utwór jako strukturalną partyturę JSON, a oprogramowanie renderuje poszczególne instrumenty i wokal do gotowego pliku audio.

Kluczowy przepływ:

```text
CZŁOWIEK
   ↓
song.json
   ↓
parser
   ↓
instrumenty + wokal
   ↓
offline rendering
   ↓
stems WAV
   ↓
mix
   ↓
FINAL WAV
```

Najważniejsze założenia:

- offline,
- local-first,
- pełna kontrola autora,
- AI jako wykonawca i edytor, a nie jako autor,
- otwarta architektura,
- osobne ścieżki dla instrumentów,
- możliwość eksportu do standardowych formatów,
- możliwość pracy również na słabszym komputerze,
- stopniowy rozwój od prostego MVP.
