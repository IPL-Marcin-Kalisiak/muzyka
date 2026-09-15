<?php declare(strict_types=1); ?>
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mikser muzyczny — AI Orchestra</title>
  <link rel="stylesheet" href="/assets/css/style.css">
  <script src="/assets/js/mixer.js" defer></script>
</head>
<body>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">◈</span> AI <strong>ORCHESTRA</strong></a><nav aria-label="Nawigacja"><a href="/">Studio</a><a href="/piano">Pianino</a><a href="/guitar">Gitara</a><a href="/violin">Skrzypce</a><a class="active" href="/mixer">Mikser</a></nav><span class="local"><i></i> LOKALNE STUDIO</span></header>
<main class="mixer-page">
  <section class="mixer-intro"><span class="eyebrow">ŚCIEŻKI → JEDEN UTWÓR</span><h1>Mikser muzyczny</h1><p>Wczytaj gotowe pliki WAV, sprawdź każdy instrument oddzielnie, ustaw poziomy i uruchom całą orkiestrę od wspólnego początku.</p></section>
  <section class="mixer-workspace">
    <div class="mixer-toolbar">
      <label class="button mixer-add" for="mixer-files">Dodaj pliki WAV <span>＋</span></label>
      <input id="mixer-files" type="file" accept="audio/wav,.wav" multiple hidden>
      <button class="button outline" id="mixer-play-all" type="button" disabled>Odtwórz wszystkie <span>▶</span></button>
      <button class="mixer-stop" id="mixer-stop" type="button" disabled>■ Zatrzymaj</button>
      <button class="button" id="mixer-export" type="button" disabled>Połącz i pobierz WAV <span>↓</span></button>
    </div>
    <div class="mixer-master"><span><small>CZAS MIKSU</small><strong id="mixer-clock">00:00 / 00:00</strong></span><div class="mixer-progress"><i id="mixer-progress-bar"></i></div><label>Poziom główny <output id="mixer-master-value">100%</output><input id="mixer-master" type="range" min="0" max="125" value="100"></label></div>
    <div class="mixer-drop" id="mixer-drop"><span class="icon">≋</span><strong>Dodaj pierwsze ścieżki WAV</strong><span>Wybierz kilka plików albo przeciągnij je tutaj.</span></div>
    <div class="mixer-tracks" id="mixer-tracks" aria-live="polite"></div>
    <p class="mixer-status" id="mixer-status" role="status">Pliki pozostają w pamięci przeglądarki i nie są wysyłane na serwer.</p>
    <a id="mixer-download" hidden download="ai-orchestra-mix.wav"></a>
  </section>
  <section class="next"><div><span class="eyebrow">PRZEWIDYWALNY MIKS</span><h2>Wspólny początek.<br><em>Osobna kontrola.</em></h2><p>Każda ścieżka zaczyna się w czasie 00:00. Najdłuższy plik wyznacza długość miksu. Suwaki zmieniają głośność odsłuchu i eksportowanego WAV.</p></div><a class="button outline" href="/">Wróć do studia ↗</a></section>
</main>
<footer>AI ORCHESTRA <span>/</span> MIKSER <span class="footer-right">Kompozycja należy do Ciebie.</span></footer>
</body>
</html>
