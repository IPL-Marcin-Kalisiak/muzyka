# Dziennik pracy — AI Orchestra

Czytaj przed rozpoczęciem zadania. Po każdym zadaniu dopisz najnowszy, zwięzły wpis na górze. Podawaj stan faktyczny oraz następny krok.

## 2026-09-15 — „W grocie króla gór” na skrzypce

- Zrobiono: dodano `in_the_hall_of_the_mountain_king_violin.json` jako solową partię skrzypiec MusicJSON 0.3. Melodia i siedmiostopniowe accelerando pochodzą z wersji pianina, a zapis tickowy i struktura pojedynczego instrumentu z wersji gitary. Wielodźwięki finału zredukowano do najwyższego głosu.
- Dlaczego: użytkownik chce wykonać ten sam materiał na trzecim instrumencie i bezpośrednio porównać barwy w AI Orchestra.
- Sprawdzono: 256 nut, zakres B3–F♯6, 119,29 s; Python + FluidSynth tworzy stereo WAV 44,1 kHz ze szczytem −4,0 dBFS i bez obciętych próbek. Plik pojawia się automatycznie na `/violin` i jest dostępny przez bezpieczny endpoint katalogu.
- Otwarte: `bow_direction`, pozycja i artykulacja są metadanymi; obecny bank SF2 wykonuje wysokość, czas, tempo i velocity.
- Następny krok: odsłuchać skrzypce samodzielnie oraz razem z fortepianem lub gitarą w mikserze i dopasować poziomy ścieżek.
## 2026-09-15 — strona skrzypiec i dwa silniki

- Zrobiono: dodano `/violin` z wygenerowaną fotografią, interaktywnym czterostrunowym gryfem, automatyczną listą skrzypcowych JSON i eksportem WAV. Użytkownik może wybrać próbkowane skrzypce FreePats przez lokalny Python + FluidSynth albo model syntetyczny Web Audio. Dodano oryginalne studium `amber_evening_violin.json`, nawigację oraz dokumentację.
- Dlaczego: skrzypce są trzecim instrumentem AI Orchestra i mają działać analogicznie do pianina oraz gitary, z przewidywalnym wyborem barwy.
- Sprawdzono: PHP i JS przechodzą kontrolę składni; próbny render 48 nut tworzy stereo WAV 44,1 kHz o długości 21,01 s i szczycie około −4,3 dBFS. Bank, interpreter oraz silnik są wewnątrz projektu.
- Otwarte: SF2 używa jednego presetu i nie wykonuje jeszcze artykulacji, kierunku/nacisku smyczka, portamento ani parametrów vibrato z JSON.
- Następny krok: po odsłuchu dobrać osobne próbki artykulacji lub zaprojektować pola wykonawcze MusicJSON dla smyczków.
## 2026-09-15 — regulacja miksera w czasie rzeczywistym

- Zrobiono: suwaki każdej ścieżki, przyciski wyciszenia i poziom główny aktualizują aktywne `GainNode` podczas odtwarzania; zmiana ma 15 ms wygładzenia. Wyciszone przy starcie ścieżki nadal mają uruchomione źródło, dlatego można je włączyć w trakcie bez utraty synchronizacji.
- Dlaczego: pierwsza wersja zapisywała wartości suwaków tylko do przyszłego odtworzenia i eksportu, więc użytkownik nie słyszał regulacji na bieżąco.
- Sprawdzono: połączenie każdego suwaka z bieżącym węzłem ścieżki i suwaka głównego z węzłem master; składnia JS poprawna.
- Otwarte: mikser nadal nie ma mierników poziomu ani panoramy.
- Następny krok: dodać wskaźniki szczytu, jeśli podczas praktycznego miksowania potrzebna będzie kontrola przesterowania.

## 2026-09-15 — lokalny mikser ścieżek WAV

- Zrobiono: dodano przejście z głównego widoku do `/mixer` oraz stronę do wczytywania wielu WAV. Każdą ścieżkę można odsłuchać solo, wyciszyć, ustawić jej poziom, uruchomić wszystkie od wspólnego początku i pobrać stereofoniczny miks WAV. Dodano opis działania i zaktualizowano mapę projektu.
- Dlaczego: użytkownik chce składać osobno wygenerowane instrumenty w jeden utwór i móc kontrolować ich odsłuch.
- Sprawdzono: składnia PHP i JS; strona główna pokazuje nowe przejście, `/mixer` otwiera kompletny interfejs z nieaktywnymi przyciskami do czasu dodania WAV. Funkcje używają lokalnego Web Audio i nie wysyłają wczytanych WAV na serwer.
- Otwarte: wszystkie ścieżki zaczynają się w 00:00; brak panoramy, przesunięcia, przycinania, efektów i miernika przesterowania.
- Następny krok: po praktycznym miksie dodać panoramę oraz przesuwanie początku ścieżek lub miernik poziomu, zależnie od potrzeb.

## 2026-09-15 — przygotowanie publikacji repozytorium

- Zrobiono: przygotowano cały projekt do pierwszego commitu i wysłania do `IPL-Marcin-Kalisiak/muzyka`; dodano `.gitignore` dla wyników tymczasowych i cache. Duże banki SF2 i archiwa są przeznaczone do Git LFS, ponieważ bank YDP przekracza limit 100 MB pojedynczego pliku GitHub.
- Dlaczego: użytkownik wskazał własne repozytorium i polecił wysłać całość wraz z lokalnymi silnikami projektu.
- Sprawdzono: utworzono commit `1d3c34e` obejmujący 183 pliki; GitHub przyjął gałąź `main`, a Git LFS wysłał 9 obiektów o łącznym rozmiarze 289 MB. Lokalna gałąź śledzi `origin/main`.
- Otwarte: odbiorca repozytorium musi mieć Git LFS, aby po klonowaniu pobrać właściwą zawartość banków i archiwów zamiast wskaźników.
- Następny krok: kolejne zmiany zapisywać małymi commitami i wysyłać na `main` lub przyszłe gałęzie funkcjonalne.

## 2026-09-13 — pełne studium Latin Fingerstyle w MusicJSON 0.5

- Zrobiono: renderer gitary obsługuje wersję 0.5 ze stałym `global.tempo_bpm` i zdarzeniami `guitar_percussion`; komunikat syntetycznego podglądu kieruje do Python + FluidSynth. Uzupełniono opis formatu, silnika, katalogu i renderowania.
- Dlaczego: `latin_fingerstyle_training_full.json` jest na liście gitary, ale różnił się od obsługiwanej wersji 0.4 sposobem zapisu tempa.
- Sprawdzono: 1241 nut i 470 zdarzeń renderują do stereo WAV 44,1 kHz o długości 297,17 s; audio w okolicach 250 sekundy ma niezerowy poziom. Starszy plik 0.4 nadal renderuje 228 nut i 202 zdarzenia; JS przeszedł kontrolę składni.
- Otwarte: przeglądarkowy syntetyczny renderer nie obsługuje 0.5; model perkusji pozostaje uproszczony.
- Następny krok: odsłuchać całość i zdecydować, czy zbudować próbkowany model odgłosów pudła/strun.

## 2026-09-13 — render gitarowego MusicJSON 0.4

- Zrobiono: rozszerzono lokalny renderer gitary o MusicJSON 0.4 i ścieżkę uderzeń w pudło oraz stłumione struny. Poprawiono zwięzły komunikat błędu i komunikat wariantu syntetycznego. Uzupełniono dokumentację formatu, silnika i strukturę.
- Dlaczego: `despacito_full_solo_guitar.json` był widoczny na stronie, lecz renderer odrzucał jego wersję 0.4 przed wykonaniem nut.
- Sprawdzono: plik renderuje 228 nut SF2 i 202 zdarzenia perkusyjne do WAV. W źródłowym MIDI zapis nut kończy się po około 49 sekundach, a JSON zawiera około 46 sekund zdarzeń; nie należy przedstawiać go jako całego nagrania mimo nazwy „full”.
- Otwarte: perkusja jest prostym modelem PCM, a nie próbkiem prawdziwych uderzeń; syntetyczny eksport w przeglądarce nie obsługuje 0.4. Do całego utworu potrzebny jest kompletny MIDI.
- Następny krok: sprawdzić odsłuch nowego WAV i po dostarczeniu pełniejszego MIDI ponownie przygotować całą aranżację.

## 2026-09-13 — sprawdzenie dostępności „Despacito”

- Zrobiono: przeszukano wszystkie pliki JSON w `app/library` pod kątem tytułu i wykonawcy; nie znaleziono partytury „Despacito”. Nie wygenerowano zapisu ani audio.
- Dlaczego: użytkownik chciał cały utwór na gitarę, a w projekcie nie ma materiału źródłowego. Pełnej cudzej kompozycji nie należy odtwarzać z zewnętrznego źródła bez dostarczonej przez użytkownika partytury lub uprawnienia.
- Sprawdzono: lista ośmiu JSON w katalogu biblioteki i wyszukiwanie nazw.
- Otwarte: potrzebna jest dostarczona przez użytkownika partytura/MIDI z prawem do użycia albo wybór oryginalnej kompozycji w podobnym klimacie.
- Następny krok: po otrzymaniu źródła przygotować kompletną aranżację MusicJSON 0.3 i render gitarowy.

## 2026-09-13 — matematyczne wzory w muzyce klasycznej

- Zrobiono: przejrzano badania nad oczekiwaniem, powtórzeniem, harmonią, synkopą i różnicami kulturowymi; zmierzono interwały i powtarzalność motywów w trzech lokalnych partyturach. Wyniki, źródła, ograniczenia i plan mierników zapisano w `dokumentacja/matematyka-muzyki.md`.
- Dlaczego: użytkownik chce odnaleźć mierzalne zależności kompozycyjne przydatne w AI Orchestra, zachowując kontrolę nad muzyką.
- Sprawdzono: obliczenia wykonano z oryginalnych JSON w `app/library`; odpowiednio 49, 310 i 326 nut prawej ręki. Wyniki nie stanowią dowodu na uniwersalny wzór przeboju.
- Otwarte: próba jest mała i niejednorodna; brak ocen słuchaczy oraz kontroli dla innych utworów. Nie powstał jeszcze analizator w interfejsie.
- Następny krok: zbudować moduł odczytu różnych wersji MusicJSON do wspólnej osi czasu, a potem raport krzywych motywu, rytmu i napięcia z przykładami konkretnych taktów.

## 2026-09-13 — obsługa Vivaldi Spring Allegro na pianinie

- Zrobiono: skierowano MusicJSON 0.3 z tickami MIDI do istniejącego parsera pianina używanego dla 0.2; w podglądzie syntetycznym doprecyzowano komunikat o braku obsługi wersji tickowej. Zaktualizowano opis formatu, silnika i mapę biblioteki.
- Dlaczego: `vivaldi_spring_allegro_piano.json` jest partyturą 0.3 z dwiema rękami i 450 nutami, a poprzednio trafiał do parsera 0.1 z czasem w ósemkach.
- Sprawdzono: lokalny Python i FluidSynth wyrenderowały analizę wszystkich 450 nut; szczyt dla modelu YDP wyniósł −12 dBFS. Składnia JS poprawna.
- Otwarte: syntetyczny renderer przeglądarkowy nie obsługuje wersji 0.3; do tego pliku należy wybrać próbkowane pianino.
- Następny krok: przy dodawaniu kolejnych plików 0.3 sprawdzać zgodność pól MIDI przed eksportem.

## 2026-09-13 — gitara klasyczna i próbkowany silnik

- Zrobiono: dodano stronę `/guitar` z wygenerowaną fotografią, syntetycznym gryfem i listą gitarowych JSON; podłączono lokalny renderer Python → FluidSynth → FreePats Spanish classical guitar SF2 jako domyślne brzmienie WAV. Zachowano wcześniejszy wariant syntetyczny. Uzupełniono mapę struktury, format i rejestr silników.
- Dlaczego: projekt ma obsługiwać wiele instrumentów i utworów, a dotychczasowa gitara brzmiała zbyt sztucznie. Próbki prawdziwego instrumentu dają naturalniejszą barwę bez ingerencji w partyturę lub wygląd pianina.
- Sprawdzono: składnia PHP i JS; całe 1354 nuty renderują się do stereo WAV 44,1 kHz, około 148,5 s, z niezerowym poziomem dźwięku. Bank i oryginalna nota CC0 są zapisane w projekcie.
- Otwarte: gryf nadal korzysta z modelu syntetycznego; renderer SF2 nie interpretuje palcowania struna/próg ani fizycznych niuansów artykulacji.
- Następny krok: porównać brzmienie próbek z aranżacją i zdecydować, czy dodać próbkowany odsłuch pojedynczych dźwięków na gryfie.

## 2026-09-13 — poziom końcowego WAV i ostrzeżenia per utwór

- Zrobiono: pod suwakiem balansu dodano poziom końcowego WAV (−12…+12 dB). Nowy `/api/piano-level` renderuje wskazany JSON z modelem i balansem, mierzy szczyt PCM, a strona pokazuje ostrzeżenie o możliwie zbyt cichym lub zbyt głośnym eksporcie. Eksport stosuje żądane wzmocnienie z ograniczeniem szczytu do około −1 dBFS; pokazuje faktycznie użyte dB. Podgląd syntetyczny używa tego samego suwaka i jest oceniany po renderowaniu. Uzupełniono dokumentację silników, formatu i renderowania.
- Dlaczego: użytkownik chce świadomie ustawiać głośność dla każdej partytury, z różnymi ostrzeżeniami zależnymi od danych i modelu, bez zmiany nut ani dynamiki zapisanej w JSON.
- Sprawdzono: `fur_elise_piano.json` na YDP ma szczyt −17,2 dBFS; +8 dB dało −9,2 dBFS. Głośny `in_the_hall_of_the_mountain_king_piano.json` na Kawai ma już 0 dBFS i przy żądaniu +8 dB eksport zastosował −1 dB, kończąc na −1 dBFS. Endpoint analizy zwrócił −17,2 dBFS; eksport przez HTTP 200 z nagłówkiem zastosowanego poziomu. Składnia PHP i JS poprawna.
- Otwarte: analiza szczytu nie jest pomiarem odczuwanej głośności LUFS; przesterowania obecnego w surowym renderze nie da się usunąć samym ściszeniem. Pierwsza analiza po wyborze utworu wymaga lokalnego renderu.
- Następny krok: jeśli potrzebne porównywalne poziomy odczuwane, dodać pomiar LUFS/true peak i osobne ustawienie docelowej głośności.

## 2026-09-13 — pomiar zapasu poziomu WAV

- Zrobiono: przeanalizowano uwagę o cichym eksporcie i zmierzono szczyty 10 kombinacji (5 partytur × 2 modele SF2) w bieżącym rendererze. Nie zmieniono jeszcze toru audio ani JSON.
- Dlaczego: przed podbiciem głośności trzeba ustalić, czy stałe +6–8 dB nie przesteruje głośniejszych utworów.
- Sprawdzono: większość szczytów mieści się od około −17,2 do −9,0 dBFS; `in_the_hall_of_the_mountain_king_piano.json` na YDP osiąga −1,6 dBFS, a na Kawai 0 dBFS (14 próbek blisko pełnej skali). Wyniki testowe usunięto z `python/output`.
- Otwarte: sam peak nie opisuje odczuwanej głośności; pojedynczy transjent może ograniczać normalizację. Nie ma jeszcze pomiaru LUFS ani true peak.
- Następny krok: jeśli użytkownik zechce poprawy poziomu, wdrożyć opcjonalny etap końcowy z limitem około −1 dBFS i kontrolą głośności, po weryfikacji wszystkich modeli i partytur; nie stosować jednego stałego podbicia do wszystkiego.

## 2026-09-13 — drugi lokalny model pianina

- Zrobiono: dodano pełny SoundFont FreePats Upright Piano KW (Kawai, wydanie 2022-02-21) do `app/instruments/piano/upright-kw`, zachowując noty CC0 i archiwum w `server/packages`. Na `/piano` dodano opcję Kawai Upright KW obok dotychczasowego domyślnego YDP Grand Piano i podglądu syntetycznego. Endpoint dopuszcza tylko `ydp` albo `upright-kw`; Python wybiera bank SF2 bez zmiany partytury. Uzupełniono rejestr silników, mapę i dokumentację.
- Dlaczego: użytkownik chce drugi, odmienny model brzmienia bez utraty obecnego fortepianu i ustawień.
- Sprawdzono: obie wersje wyrenderowały tę samą partyturę do niepustych, różnych plików stereo WAV; Kawai działa również z MusicJSON 0.2 i balansem. Endpoint Kawai zwrócił 200/audio-wav, nieznany model 400, strona `/piano` 200 z nową opcją. Składnia JS i PHP poprawna.
- Otwarte: klawiatura interaktywna nadal używa niezmienionego podglądu Web Audio; wybór próbkowanego modelu dotyczy eksportu partytury. Nie ma automatycznej zmiany SF2 na podstawie pola `render` w JSON.
- Następny krok: jeśli potrzebny trwały wybór w projekcie utworu, opisać identyfikator instrumentu i jego wariant w przyszłym schemacie MusicJSON.

## 2026-09-13 — porównanie dwóch partytur „W grocie Króla Gór”

- Zrobiono: porównano strukturę obu plików z biblioteką i bieżącą obsługą formatu; poprawiono opis pliku `MUSICJSON.md` w mapie katalogów.
- Dlaczego: użytkownik chce wiedzieć, czy nowy JSON jest bogatszy i czy projekt rzeczywiście obsługuje jego dodatkowe dane.
- Sprawdzono: wersja 0.1 ma 568 nut, 1 ścieżkę, 7 zmian tempa i 0 zdarzeń CC; konwersja MIDI 0.2 ma 1453 nuty, 2 ścieżki, 2 zmiany tempa i 700 zdarzeń CC. Renderer 0.2 używa ticków, tempa i CC; oba warianty korzystają z tego samego SF2.
- Otwarte: 0.2 zachowuje więcej danych wykonawczych, ale nie jest jeszcze uniwersalnym, stabilnym schematem; część metadanych konwersji nie steruje dźwiękiem.
- Następny krok: ujednolicić schemat bez utraty ticków i zdarzeń wykonawczych.

## 2026-09-13 — obsługa konwersji MIDI 0.2

- Zrobiono: renderer Python rozpoznaje `MusicJSON` 0.2 z dwiema ścieżkami rąk, oryginalnymi tickami MIDI, mapą tempa w mikrosekundach na ćwierćnutę oraz MIDI CC, w tym pedałem CC64. Zachowano eksport 0.1. Poprawiono kodowanie błędów Pythona na UTF-8 i komunikat dla wariantu przeglądarkowego, który 0.2 nie obsługuje. Uzupełniono rejestr silników, opis JSON i dokumentację.
- Dlaczego: nowy `in_the_hall_of_the_mountain_king_original_from_midi.json` nie ma `time_unit=eighth_note`; stary parser błędnie traktował go jak partyturę 0.1 i pokazywał zniekształcone polskie znaki.
- Sprawdzono: Python i endpoint PHP generują z nowego pliku stereofoniczny WAV 44,1 kHz około 148 s z 1453 nut. Wszystkie pięć partytur generuje WAV po zmianie; składnia PHP i JS poprawna. Złapany błąd Pythona jest poprawnym UTF-8.
- Otwarte: przeglądarkowy syntezator prototypowy nie obsługuje 0.2; zachowany jest jako wybór dla partytur 0.1. Formalne połączenie schematów obu wersji pozostaje do zaprojektowania.
- Następny krok: określić wspólny kanoniczny format partytury i konwersję starszych plików, bez utraty danych wykonawczych z MIDI.

## 2026-09-13 — rejestr silników i opis MusicJSON

- Zrobiono: utworzono `.agents/INSTRUMENT_ENGINES.md` z faktycznie używanymi wersjami, ścieżkami, rolami, licencjami i ograniczeniami PHP/Python/FluidSynth/SF2/Web Audio. Utworzono `.agents/MUSICJSON.md` z działającym przykładem, tabelą pól 0.1, semantyką czasu i tempa, regułami tworzenia nowego JSON oraz listą spraw do formalnego schematu. Zaktualizowano mapę i wytyczne agentów, aby te pliki były utrzymywane.
- Dlaczego: użytkownik chce trwałej, uporządkowanej informacji o zapleczu instrumentów i jednoznacznego punktu odniesienia dla partytur.
- Sprawdzono: opis porównano z czterema plikami w `app/library`, kodem renderera Python i podglądu JS oraz rzeczywistymi katalogami lokalnych zależności.
- Otwarte: formalny JSON Schema nie istnieje; niektóre pola zapisane w partyturach, zwłaszcza `articulation`, `mix` i `render`, nie są jeszcze wykonywane. Starsze pliki używają `measure: 0`, a nowa mapa tempa zakłada taktowanie od 1.
- Następny krok: po ustaleniu kanonicznych zasad czasu i numeracji taktów dodać wersjonowany JSON Schema oraz walidator z precyzyjnymi błędami.

## 2026-09-13 — poprawka utworów ze zmiennym tempem

- Zrobiono: renderer Python i podgląd przeglądarkowy obsługują `global.tempo_map` z numerami taktów, obok wcześniejszego pojedynczego `global.tempo`. Błędy walidacji Pythona wracają jako krótkie komunikaty zamiast uciętego tracebacku. Uzupełniono dokumentację i mapę biblioteki.
- Dlaczego: `in_the_hall_of_the_mountain_king_piano.json` ma mapę tempa zamiast pojedynczego pola, więc dotychczasowy renderer go odrzucał.
- Sprawdzono: wszystkie cztery partytury pianina generują WAV lokalnym Pythonem: 85, 180, 275 i 568 nut; nowy utwór trwa około 90 s. Zmiana nie zepsuła obu plików „Dla Elizy”.
- Otwarte: brak jawnego `beat_unit` w mapie jest interpretowany jako ćwierćnuta; warto utrwalić tę konwencję w przyszłym schemacie MusicJSON.
- Następny krok: dodać wersjonowany schemat MusicJSON i walidację semantyki mapy tempa przy dodawaniu partytury.

## 2026-09-13 — lokalny fortepian próbkowany przez Python

- Zrobiono: dodano do projektu Python 3.12.10 embeddable, FluidSynth 2.5.4 i YDP Grand Piano SF2; skrypt `python/render_piano.py` przekłada MusicJSON na MIDI i renderuje stereo WAV z próbek. Na `/piano` dodano wybór brzmienia, zachowując poprzedni podgląd syntetyczny i bez zmiany klawiatury. PHP udostępnia tylko render z partytur znalezionych w bibliotece. Dodano dokumentację i atrybucję CC BY 3.0.
- Dlaczego: użytkownik chce realistyczniejszego brzmienia pianina sterowanego kodem Python, działającego lokalnie i offline w katalogu projektu.
- Sprawdzono: projektowy Python i FluidSynth uruchamiają się; oba JSON-y renderują WAV (85 i 180 nut). Endpoint PHP zwrócił 200 i stereo WAV 44,1 kHz. Balans -100 daje mierzalnie inny wynik niż środek. Składnia PHP i JS poprawna.
- Otwarte: nie ma jeszcze modelu pedału ani artykulacji; klawiatura zachowuje dawny syntetyczny dźwięk zgodnie z życzeniem użytkownika. Render jest próbkowany, nie neuronowy.
- Następny krok: dopracować schemat parametrów wykonania w MusicJSON i dodać pedał / artykulację, jeśli użytkownik tego zechce.

## 2026-09-13 — wyraźniejszy i automatyczny balans rąk

- Zrobiono: po pierwszym renderze zmiana suwaka automatycznie tworzy nowy odsłuch i WAV. Przebieg balansu mocniej tłumi przeciwną rękę, a skrajne ustawienia „Tylko lewa” i „Tylko prawa” całkiem ją wyciszają. Pozostały wygląd strony i gra na klawiaturze są bez zmian.
- Dlaczego: użytkownik nie słyszał różnicy; poprzedni odsłuch wymagał ręcznego ponownego renderowania, a zakres zmiany był zbyt mało czytelny słuchowo.
- Sprawdzono: składnia JS i PHP poprawna. W przeglądarce po pierwszym WAV przesunięto suwak na oba skraje; bez kliknięcia „Generuj” pojawiły się osobne nowe WAV oraz komunikaty „Tylko lewa” i „Tylko prawa”. Kod pomija nuty wyciszonej ręki przy renderowaniu.
- Otwarte: środek jest matematycznym wyrównaniem dynamiki, nie gwarancją takiej samej głośności psychoakustycznej na każdym głośniku; syntetyczne brzmienie basu może być słabo słyszalne na małych głośnikach.
- Następny krok: w docelowym rendererze dodać odrębne ścieżki i mierniki poziomu, aby regulacja była jeszcze bardziej kontrolowalna.

## 2026-09-13 — biblioteka partytur pianina

- Zrobiono: strona `/piano` wykrywa pliki JSON na podstawie `tracks[].instrument`, pokazuje wybór pasujących partytur i renderuje wskazany plik. Dodano `app/library_catalog.php`; endpoint dopuszcza tylko pliki z wykrytej listy, a pobierany WAV otrzymuje nazwę wybranego JSON. Zachowano wygląd wcześniejszych sekcji i grę klawiatury.
- Dlaczego: projekt musi obsługiwać wiele utworów, a użytkownik dodał już `fur_elise_piano_v2.json`.
- Sprawdzono: na liście widoczne są oba pliki (85 i 180 nut); oba endpointy zwracają 200, próba odczytu poza biblioteką 404. W przeglądarce wybrano v2, wyrenderowano 180 nut i potwierdzono nazwę pobrania `fur_elise_piano_v2.wav`. Składnia PHP i JS poprawna.
- Otwarte: obecny syntezator obsługuje MusicJSON z czasem w ósemkach; plik pianina z inną jednostką pojawi się na liście, ale przy renderowaniu pokaże błąd. To wymaga późniejszego ujednolicenia schematu.
- Następny krok: rozszerzyć walidację i format partytury, następnie dodać kolejne instrumenty i docelowy renderer.

## 2026-09-13 — regulacja balansu obu rąk

- Zrobiono: dodano suwak „Balans rąk” w sekcji eksportu WAV. Środek wyrównuje średnią velocity głosów `right_hand` i `left_hand`; przesunięcie wzmacnia wybraną rękę względem drugiej. Zmiana unieważnia poprzedni odsłuch i wymaga ponownego renderowania. Nie zmieniono wyglądu wcześniejszych sekcji ani działania klawiatury.
- Dlaczego: użytkownik słyszy mocniejszą prawą rękę i chce móc uzyskać równowagę lub świadomie wysunąć jedną z rąk.
- Sprawdzono: składnia JS i PHP poprawna; w przeglądarce ustawiono 50% w lewo i wygenerowano WAV z 85 nut, po czym pojawiły się odtwarzacz, pobieranie i komunikat z wybranym balansem.
- Otwarte: balans jest ustawieniem renderowania, nie jest zapisywany w JSON; odczuwalna głośność zależy też od rejestru i gęstości nut, więc pozycja środkowa jest przybliżeniem równowagi słuchowej.
- Następny krok: jeśli potrzebna trwałość ustawień, dodać parametry miksu do formatu MusicJSON i zapisywać je wraz z utworem.

## 2026-09-13 — poprawka startu i pierwszy eksport pianina

- Zrobiono: `start.bat` uruchamia projektowe PHP z `-n` i otwiera stronę w przeglądarce. Na dole `/piano` dodano osobną sekcję renderowania `fur_elise_piano.json` do WAV oraz lokalny endpoint odczytu partytury. Wygląd istniejącej strony i działanie klawiatury pozostawiono bez zmian.
- Dlaczego: skopiowany `php.ini` wskazywał globalne rozszerzenia i powodował błąd przy `!` w ścieżce; użytkownik chce teraz odsłuchać własną partyturę JSON jako plik audio.
- Sprawdzono: projektowe PHP z `-n` uruchomiło serwer; `/` i `/piano` zwracają 200. Plik JSON ma poprawny MusicJSON, 2 głosy i 85 nut; `/api/piano-score`, strona i skrypt zwracają 200, a bezpośredni dostęp do `app/library` zwraca 404. Składnia PHP i JS poprawna. W przeglądarce kliknięto „Generuj plik WAV”: pojawił się odtwarzacz, link pobrania i komunikat o 85 nutach oraz około 34 s audio.
- Otwarte: brzmienie jest syntetyczne; nie obsługuje osobno artykulacji ani VST. `start.bat` otwiera przeglądarkę przed uruchomieniem serwera, co może wymagać odświeżenia strony przy bardzo szybkim starcie przeglądarki.
- Następny krok: ustalić docelowy renderer pianina i schemat MusicJSON; później dodać wybór kolejnych utworów z biblioteki.

## 2026-09-13 — strona startowa i pianino

- Zrobiono: zaprojektowano strony `/` i `/piano`, wygenerowano realistyczny obraz fortepianu i zapisano go w `public_html/assets/images`, dodano wspólny styl oraz klawiaturę z lokalnym odsłuchem Web Audio. Zaktualizowano mapę struktury i dokumentację.
- Dlaczego: użytkownik chce estetycznego, spójnego początku aplikacji oraz pierwszej strony instrumentu.
- Sprawdzono: składnia trzech plików PHP i skryptu JS poprawna; strony oraz CSS, JS i obraz zwracają HTTP 200 z lokalnego serwera.
- Otwarte: klawiatura jest podglądem syntezowanym w przeglądarce, nie docelowym brzmieniem pianina; nie zapisuje `song.json`.
- Następny krok: minimalny format partytury i powiązanie edytora pianina z danymi utworu.

## 2026-09-13 — osobna mapa struktury

- Zrobiono: dodano `.agents/STRUCTURE.md` z pełną mapą istniejących katalogów, ich przeznaczeniem i oddzielonym planem. `AGENTS.md` nakazuje czytać i aktualizować mapę; dokumentacja wskazuje jej lokalizację.
- Dlaczego: użytkownik chce utrzymać porządek i trwałą pamięć struktury w `.agents`.
- Sprawdzono: mapę porównano z istniejącymi katalogami i plikami projektu.
- Otwarte: składniki Python i pipeline audio pozostają planowane.
- Następny krok: przy kolejnej implementacji dodać minimalną partyturę i aktualizować tę mapę razem ze strukturą.

## 2026-09-13 — lokalny szkielet aplikacji

- Zrobiono: utworzono `public_html/index.php` → `app/router.php`, widok startowy, katalogi `app/library`, `app/instruments`, `app/vocal/<język>/<głos>`, `dokumentacja`, `python`, lokalną kopię PHP w `server/php` oraz `start.bat`. Utrwalono strukturę w `AGENTS.md`.
- Dlaczego: użytkownik wskazał dokładną organizację aplikacji przeglądarkowej i wymóg przechowywania wszystkich składników w katalogu projektu.
- Sprawdzono: trzy pliki PHP przeszły kontrolę składni; lokalny serwer zwrócił `200` dla strony głównej i `404` dla `/app/router.php`.
- Otwarte: Python nie jest jeszcze dostępny w projekcie; nie ma schematu `song.json`, edytora ani renderowania audio. Kopia PHP pochodzi z lokalnego `C:\php`; `start.bat` kieruje rozszerzenia PHP do kopii projektowej, lecz przenośność na innym komputerze wymaga sprawdzenia przed dystrybucją.
- Następny krok: zdefiniować minimalny schemat partytury i dodać pierwszy utwór oraz interfejs edycji; następnie wprowadzić lokalny runtime Pythona i ścieżkę renderowania.

## 2026-09-13 — analiza założeń i wytyczne agenta

- Zrobiono: przeanalizowano `AI_Orchestra_założenia_projektu.md` i dodano `AGENTS.md` z zasadami projektu oraz obowiązkowym raportowaniem pracy.
- Dlaczego: projekt ma być długotrwały; potrzebuje trwałego kontekstu decyzji i postępu. Użytkownik doprecyzował, że docelowym interfejsem jest aplikacja przeglądarkowa do przewidywalnego tworzenia muzyki z kodu.
- Sprawdzono: dokument źródłowy i zawartość katalogu; obecnie repozytorium zawierało tylko dokument założeń i nie było repozytorium Git.
- Otwarte: trzeba ustalić minimalny schemat `song.json`, w szczególności jednostki czasu, wersjonowanie, parametry renderowania i zachowanie nieobsługiwanych parametrów.
- Następny krok: zdefiniować minimalny format oraz pierwszy działający przepływ partytura → MIDI/audio z prostym interfejsem przeglądarkowym.
