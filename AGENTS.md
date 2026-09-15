# AI Orchestra — wytyczne pracy agenta

## Cel i źródła

- Przeczytaj `AI_Orchestra_założenia_projektu.md` przed decyzjami o architekturze i funkcjach. To dokument wizji; niniejsze wytyczne określają sposób pracy.
- Budujemy **lokalną aplikację obsługiwaną w przeglądarce** do tworzenia muzyki z kodu i danych strukturalnych. Kompozytor kontroluje melodię, harmonię, strukturę, instrumenty, artykulację, dynamikę, tempo, miks i eksport.
- Przeglądarka jest interfejsem, a projekt, silniki wykonawcze i pliki audio mają działać lokalnie i docelowo offline. Nie wymagaj konta ani usług chmurowych do podstawowej pracy.
- `song.json` jest źródłem prawdy o utworze. MIDI i WAV są wynikami lub formatami pośrednimi. AI pomaga edytować i wykonywać jawne instrukcje; nie przejmuje autorstwa utworu.
- Aktualne polecenia użytkownika mają pierwszeństwo przed starszymi propozycjami z dokumentu. W szczególności zapis o późniejszym GUI nie zmienia obecnego celu aplikacji przeglądarkowej.

## Zasady projektowe

- Zachowaj strukturę `public_html/index.php` → `app/router.php`; widoki trzymaj w `app/view`, utwory JSON w `app/library`, zasoby instrumentów w `app/instruments/<instrument>`, a zasoby głosów w `app/vocal/<język>/<głos>` (np. `pl/Agnieszka`, `es`, `en`). Dokumentację rozwijaj w `dokumentacja`.
- `start.bat` w katalogu głównym uruchamia lokalny serwer z plików znajdujących się w tym projekcie. Wszystkie składniki aplikacji, w tym przyszły interpreter i pakiety Pythona, przechowuj w `C:\!!!_MuZyKa_!!!`; nie instaluj ich globalnie ani nie zapisuj danych projektu poza tym katalogiem.
- Serwer udostępnia tylko `public_html`. Nie wystawiaj przez HTTP partytur, głosów, bibliotek instrumentów, konfiguracji ani kodu serwera. PHP korzysta z nich po stronie serwera.

- Preferuj małe, sprawdzalne kroki od minimalnej partytury przez walidację, eksport MIDI i render audio po kolejne instrumenty, wokal i miks. Nie rozbudowuj aplikacji o pełny DAW przed działającym przepływem `song.json` → audio.
- Zachowuj przewidywalność: ta sama partytura, te same ustawienia, wersje silników i zasoby powinny dawać ten sam wynik w granicach możliwości renderera. Losowe odchylenia, w tym humanizacja, muszą mieć jawne parametry i ziarno (`seed`) albo być wyłączone.
- Definiuj precyzyjnie jednostki czasu, numerację taktów, zakresy parametrów, wartości domyślne i wersję schematu. Waliduj dane przed renderowaniem; błędy pokazuj z lokalizacją w partyturze i zrozumiałą przyczyną.
- Nie ukrywaj zmian w partyturze wykonywanych przez AI. Pokaż proponowany zakres i różnicę, pozwól je sprawdzić oraz cofnąć. Nie zmieniaj nut ani aranżacji poza zakresem polecenia.
- Rozdzielaj model partytury, edytor przeglądarkowy, translatory formatów, renderery instrumentów, miks i eksport. Brak obsługi parametru przez konkretny renderer powinien być jawny, a nie cicho ignorowany.
- Zachowuj możliwość renderowania osobnych ścieżek i ponownego renderowania tylko zmienionych partii. Uwzględniaj działanie na słabszym sprzęcie, także renderowanie sekwencyjne.
- Rozwiązania techniczne z dokumentu, takie jak Python, OpenUTAU czy VST, traktuj jako propozycje do weryfikacji, a nie bezwarunkowe zobowiązania.

## Ciągłość pracy — obowiązkowo przy każdym zadaniu

1. Na początku przeczytaj `.agents/STRUCTURE.md` i `.agents/WORKLOG.md`, sprawdź stan plików i ostatnie decyzje. Nie zakładaj, że poprzednia rozmowa zawiera cały kontekst.
   Przy pracy nad instrumentem lub renderowaniem sprawdź także `.agents/INSTRUMENT_ENGINES.md`; przy pracy nad partyturą lub parserem sprawdź `.agents/MUSICJSON.md`.
2. Po pracy dopisz **krótki wpis** do `.agents/WORKLOG.md`: data, co zrobiono, dlaczego, jak sprawdzono, co pozostaje i jaki jest najbliższy krok. Przy decyzji architektonicznej zapisz także uzasadnienie lub otwarte pytanie. Zachowuj fakty; nie wpisuj planów jako ukończonych.
3. W końcowej odpowiedzi do użytkownika zawsze krótko powiedz **co zrobiłeś i dlaczego**, podaj wynik sprawdzenia oraz najbliższy sensowny krok lub przeszkodę. Wpis w dzienniku nie zastępuje odpowiedzi.
4. Aktualizuj wpis również po analizie bez zmian w kodzie, jeśli powstał wniosek ważny dla dalszych prac. Nie zapisuj do dziennika haseł, tokenów ani danych wrażliwych.
5. Po zmianie struktury katalogów lub przeznaczenia istotnego pliku zaktualizuj `.agents/STRUCTURE.md` w tym samym zadaniu. Nie pozostawiaj mapy nieaktualnej.
6. Po zmianie silnika, biblioteki albo formatu partytury zaktualizuj odpowiednio rejestr silników lub opis MusicJSON w tym samym zadaniu.

## Zakres tej konfiguracji

`AGENTS.md` jest instrukcją dla agentów pracujących w tym katalogu. `.agents/STRUCTURE.md` jest główną mapą katalogów, a `.agents/WORKLOG.md` zwięzłym śladem postępu; nie zastępują historii Git ani dokumentacji technicznej.
