# Mikser plików WAV

Strona `/mixer` łączy gotowe pliki WAV lokalnie w przeglądarce. Pliki wybrane z dysku są odczytywane przez Web Audio API i nie są wysyłane do PHP. Można dodać wiele ścieżek, odsłuchać pojedynczą ścieżkę przyciskiem „Solo”, wyciszyć ją, ustawić poziom 0–125% oraz rozpocząć wszystkie ścieżki od wspólnego czasu 00:00. Suwaki poziomu ścieżek, wyciszenie i suwak główny sterują aktywnymi węzłami `GainNode`, więc są słyszalne w czasie rzeczywistym bez ponownego uruchamiania odtwarzania. Zmiana jest łagodzona przez 15 ms, aby nie powodowała kliknięć.

Przycisk „Połącz i pobierz WAV” używa `OfflineAudioContext`. Częstotliwość wyjściowa jest najwyższą częstotliwością wczytanych ścieżek, a przeglądarka przelicza pozostałe. Wynik jest stereofonicznym PCM WAV 16-bit. Najdłuższa ścieżka wyznacza długość, krótsze kończą się wcześniej. Poziomy ścieżek, wyciszenie i poziom główny wpływają na odsłuch oraz eksport.

W pierwszej wersji wszystkie pliki zaczynają się razem. Nie ma jeszcze przesuwania początku ścieżki, panoramy, przycinania, efektów, automatyki ani zapisywania sesji. Mikser ogranicza próbki do zakresu PCM przy eksporcie; suma głośnych ścieżek może więc spowodować przesterowanie. Przyszła wersja powinna dodać miernik szczytu i normalizację podobną do rendererów instrumentów.
