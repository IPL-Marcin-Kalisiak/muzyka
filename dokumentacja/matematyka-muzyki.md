# Matematyka muzyki — hipotezy do analizy w AI Orchestra

Stan: 2026-09-13. Celem jest rozpoznawanie wzorów i wspieranie decyzji kompozytora, nie automatyczna ocena „piękna” ani gwarancja przeboju. Analiza klasyki wymaga porównywalnych partytur źródłowych, kontroli epoki, gatunku, instrumentacji i wykonania. Poniższe trzy lokalne JSON-y są wstępną sondą, nie reprezentatywnym korpusem arcydzieł; część jest aranżacją, a metadane i zakres utworu mogą nie odpowiadać kompletnemu oryginałowi.

## Pomiary trzech partytur w projekcie

Pomiary dotyczą kolejnych nut prawej ręki uporządkowanych po czasie. „Mały krok” to interwał 0–2 półtonów między sąsiednimi nutami. „Powtarzalność 4” to odsetek czterointerwałowych okien, których identyczny ciąg występuje co najmniej dwa razy. Okna nakładają się, a identyczna transpozycja ma ten sam wzór interwałów. To wskaźnik regularności, nie jakości. „Zmiany tempa” liczą dodatkowe wpisy `tempo_map`, nie rubato wykonawcy.

| Lokalna partytura | Nuty prawej ręki | Małe kroki | Powtarzalność 4 | Zmiany tempa |
|---|---:|---:|---:|---:|
| `fur_elise_piano.json` | 49 | 50,0% | 68,9% | 0 |
| `in_the_hall_of_the_mountain_king_piano.json` | 310 | 35,0% | 90,2% | 6 |
| `vivaldi_spring_allegro_piano.json` | 326 | 85,8% | 94,7% | 0 |

Wniosek ograniczony do tych plików: każdy powtarza krótkie wzory, lecz nie ma wspólnej wartości „idealnego” udziału małych interwałów ani obowiązkowego przyspieszenia. W „Grocie Króla Gór” zapisane tempo rośnie od 72 do 160 BPM; lokalna „Wiosna” utrzymuje 108 BPM. Stałe BPM nie oznacza stałej energii: liczba nut na sekundę, rytm, rejestr i dynamika mogą zmieniać się bez zmiany metronomu. Wskaźnik powtarzalności trzeba w przyszłości liczyć również na rytmie i w większych odcinkach, porównując z utworami mniej lubianymi, aby sprawdzić, czy odróżnia on cokolwiek od samej długości i stylu zapisu.

## Co podpowiadają badania

1. **Pamięć i oczekiwanie.** Powtórzenie pomaga słuchaczowi zbudować przewidywanie; odstępstwo może następnie przyciągnąć uwagę. W eksperymencie ocena przyjemności akordów zależała od *współdziałania* niepewności i zaskoczenia, a nie od maksymalizowania samej niespodzianki. [Cheung i in., Current Biology 2019](https://doi.org/10.1016/j.cub.2019.09.067). Badania ekspozycji wykazują również wzrost lub zmianę upodobania wraz ze znajomością melodii, zależnie od sytuacji i materiału. [Loui i in., 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2819428/).
2. **Harmonia jest przebiegiem, nie tylko zbiorem dźwięków.** Lokalne kadencje silnie wpływały na oceny napięcia w dłuższych sekwencjach akordów. Zatem dysonans może działać jako przygotowane napięcie, jeśli jego wejście, czas trwania i rozwiązanie mają sens w kontekście. [Bigand i in., Music Perception 1999/2000](https://pubmed.ncbi.nlm.nih.gov/10652864/). Badanie korpusowe kwartetów Beethovena wykazało statystyczne centra harmonii i nierównomierne użycie akordów; jest to opis stylu, nie uniwersalny przepis. [Rohrmeier i in., PLOS ONE 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6553690/).
3. **Rytm potrzebuje rozpoznawalnego pulsu i pewnej zmienności.** W kontrolowanych wzorach umiarkowana synkopa dawała silniejsze odczucie „groove” niż mała lub bardzo duża. To wynik dla konkretnych bodźców, nie reguła dla każdego allegra czy walca. [Stupacher i in., PLOS ONE 2022](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0266902).
4. **Odbiór dysonansu zależy również od uczenia i kultury.** Słuchacze Tsimane’ bez silnej ekspozycji na zachodnią harmonię nie preferowali akordów konsonansowych tak jak badane grupy zachodnie. Nie wolno więc kodować jednego zestawu „bolesnych” interwałów jako obiektywnego dla wszystkich. [McDermott i in., Nature 2016](https://www.nature.com/articles/nature18635).

## Proponowane mierniki, jeszcze niezaimplementowane

- **Motyw i wariacja:** porównuj sekwencje interwałów i długości nut w przesuwanych oknach, także po transpozycji i zmianie oktawy. Raportuj powroty motywu oraz stopień jego modyfikacji. Prosty odsetek powtórek bez normalizacji długości nie wystarcza.
- **Napięcie w czasie:** wyznacz osobne krzywe dla niestabilności tonalnej, szorstkości *brzmienia* przy współbrzmieniu, rejestru, gęstości nut i dynamiki. Zaznacz wzrosty oraz rozwiązania. Sam MIDI nie określa szorstkości — potrzebne są próbki instrumentu lub analiza WAV.
- **Puls i tempo:** licz BPM, liczbę ataków na sekundę, akcenty metryczne, przerwy, powtarzalność wzoru rytmicznego oraz synkopę oddzielnie. Ta sama wartość BPM może brzmieć spokojnie lub gwałtownie.
- **Przewidywalność:** buduj model prawdopodobieństwa następnego interwału/rytmu z korpusu danego stylu. Niespodzianka pojedynczego zdarzenia: `I = −log₂ P(zdarzenie | kontekst)`. Badaj, *gdzie* pojawiają się niespodzianki i czy następuje po nich rozpoznawalny powrót lub rozwiązanie. Model uczony tylko na danym utworze łatwo pomyli powtarzanie z wartością artystyczną.
- **Walidacja hipotez:** porównuj wiele utworów i słabsze przykłady w tym samym stylu; dziel dane po utworach i kompozytorach, nie po sąsiadujących nutach; sprawdzaj oceny słuchaczy. Wynik prezentuj jako kilka osi z niepewnością, a nie jedną „ocenę hitu”.

Robocza hipoteza kompozycyjna brzmi: **rozpoznawalny wzór → odmiana i lokalne napięcie → czytelny powrót lub rozwiązanie**. To model do testowania i narzędzie do świadomej edycji, nie udowodnione równanie piękna. Statystyczne opisy przejść nutowych w muzyce Bacha pokazują, że formalna analiza struktury jest możliwa; nie dowodzą, że jedna wartość informacji tworzy dobre dzieło. [Kulkarni i in., Physical Review Research 2024](https://journals.aps.org/prresearch/abstract/10.1103/PhysRevResearch.6.013136).
