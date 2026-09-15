# Renderowanie skrzypiec

Strona `/violin` udostępnia dwa przewidywalne sposoby wykonania tej samej partytury MusicJSON 0.3.

## Model próbkowany

Domyślny przepływ to `MusicJSON → python/render_violin.py → MIDI → FluidSynth 2.5.4 → WAV`. Renderer wybiera program General MIDI 40 (skrzypce) z banku `GeneralUser-GS-v1.471.sf2`. Cały interpreter Python, FluidSynth, SoundFont i pliki licencyjne znajdują się w projekcie, więc po instalacji repozytorium zwykłe renderowanie nie wymaga internetu.

Bank pochodzi z projektu [GeneralUser GS](https://github.com/ROCKNIX/generaluser-gs) S. Christiana Collinsa. Licencja pozwala używać go w projektach programistycznych i produkcji muzycznej; jej pełną treść oraz README i CHANGELOG zachowano w `app/instruments/violin/generaluser-gs/`. Poprzedni FreePats General MIDI był niepełny i nie zawierał programu 40, przez co FluidSynth wracał do programu 0 — pianina.

## Model syntetyczny

Interaktywny gryf i opcja „Skrzypce syntetyczne” używają Web Audio API. Barwa powstaje z kontrolowanej sumy harmonicznych, obwiedni i lekkiego vibrato. Ten model jest szybki i całkowicie lokalny, ale nie udaje pełnej fizyki smyczka.

## Obsługiwany zapis

Renderer przyjmuje MusicJSON 0.3 z `global.ticks_per_beat`, mapą `global.tempo_map` zaczynającą się w ticku 0 i jedną ścieżką, której `instrument` zawiera słowo `violin`. Każda nuta wymaga `start_tick`, `duration_ticks`, `midi_note` i `velocity`. Limit wynosi 10 000 nut i 10 minut.

Wykonywane są wysokość, początek, długość, tempo i velocity. Artykulacje smyczkowe, zmiana smyczka, portamento, nacisk smyczka oraz sterowane vibrato nie są jeszcze interpretowane. Obecny model SF2 daje wiarygodniejszą barwę niż synteza, lecz pozostaje pojedynczym presetem próbkowym.
