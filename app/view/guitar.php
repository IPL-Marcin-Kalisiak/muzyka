<?php declare(strict_types=1); ?>
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Gitara klasyczna — AI Orchestra</title>
  <link rel="stylesheet" href="/assets/css/style.css">
  <script src="/assets/js/guitar.js" defer></script>
  <script src="/assets/js/render-guitar.js" defer></script>
</head>
<body>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">◈</span> AI <strong>ORCHESTRA</strong></a><nav aria-label="Nawigacja"><a href="/">Studio</a><a href="/piano">Pianino</a><a class="active" href="/guitar">Gitara</a></nav><span class="local"><i></i> LOKALNE STUDIO</span></header>
<main>
  <section class="hero guitar-hero"><div class="hero-shade"></div><div class="hero-copy"><span class="eyebrow">— INSTRUMENT 02 / STRUNOWE</span><h1>Gitara klasyczna</h1><p>Sześć strun, jeden precyzyjny zapis. Odkryj brzmienie szarpanych dźwięków i posłuchaj gitarowej partytury z kodu.</p><a class="link" href="#gryf">Przejdź do gryfu ↓</a></div><small class="photo-caption">GITARA KLASYCZNA · STUDIUM ŚWIATŁA</small></section>
  <section class="intro"><div><span class="eyebrow">OD STRUNY DO KOMPOZYCJI</span><h2>Każde szarpnięcie.<br><em>Świadomy wybór.</em></h2></div><p>Sprawdź dźwięki na interaktywnym gryfie i wygeneruj WAV z partytury JSON. Do eksportu możesz wybrać próbki prawdziwej gitary klasycznej albo pierwszy model syntetyczny — bez zmiany zapisu utworu.</p></section>
  <section class="guitar-section" id="gryf"><div class="keyboard-heading"><div><span class="eyebrow">INTERAKTYWNY PODGLĄD</span><h2>Gryf gitary</h2></div><label>Głośność <output id="guitar-volume-value">40%</output> <input id="guitar-volume" type="range" min="0" max="100" value="40"></label></div><p>Kliknij strunę i próg, aby usłyszeć dźwięk. Struny są ułożone od najcieńszej E4 do najgrubszej E2; pole „0” oznacza pustą strunę.</p><div class="fretboard-scroll"><div class="fretboard" id="guitar-fretboard" aria-label="Interaktywny gryf gitary klasycznej"></div></div><p id="guitar-note-status" role="status" aria-live="polite">Wybierz strunę i próg.</p></section>
  <section class="next"><div><span class="eyebrow">NASTĘPNY ETAP</span><h2>Głos instrumentu w JSON</h2><p>Partytura zapisuje nuty, czas, dynamikę i przypisanie do struny oraz progu. Ten pierwszy odsłuch jest prototypem syntezy; nie udaje nagrania prawdziwej gitary.</p></div><a class="button outline" href="/">Wróć do studia ↗</a></section>
  <section class="score-render" aria-labelledby="guitar-render-heading"><div><span class="eyebrow">PARTYTURA → AUDIO</span><h2 id="guitar-render-heading">Posłuchaj gitary z JSON</h2><p>Wybierz partyturę i brzmienie. Wysokość, czas i dynamika nut pochodzą z JSON; próbkowany model korzysta z nagrań prawdziwej hiszpańskiej gitary klasycznej.</p></div><div class="render-panel"><label class="score-label" for="guitar-score-file">Dostępne partytury gitary</label><?php if ($guitarScores !== []): ?><select id="guitar-score-file" class="score-select"><?php foreach ($guitarScores as $fileName => $scoreInfo): ?><option value="<?= htmlspecialchars($fileName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><?= htmlspecialchars($fileName . ' · ' . $scoreInfo['title'] . ' (' . $scoreInfo['notes'] . ' nut)', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></option><?php endforeach; ?></select><?php else: ?><p>Brak partytur gitary w <code>app/library</code>.</p><?php endif; ?><label class="score-label" for="guitar-render-engine">Brzmienie WAV</label><select id="guitar-render-engine" class="score-select"><option value="sampled">Gitara klasyczna FreePats · próbki SF2</option><option value="synthetic">Podgląd syntetyczny · pierwszy model</option></select><button class="button" id="render-guitar" type="button"<?= $guitarScores === [] ? ' disabled' : '' ?>>Generuj plik WAV <span>↗</span></button><p id="guitar-render-status" role="status" aria-live="polite">Wybierz partyturę i wygeneruj WAV lokalnie.</p><audio id="guitar-render-preview" controls hidden></audio><a id="guitar-render-download" class="link" download="guitar.wav" hidden>Pobierz plik WAV ↓</a><small>Gryf używa nadal syntetycznego podglądu. Próbki WAV: FreePats Spanish classical guitar, CC0 1.0. Źródłowy JSON pozostaje bez zmian.</small></div></section>
</main>
<footer>AI ORCHESTRA <span>/</span> GITARA <span class="footer-right">Kompozycja należy do Ciebie.</span></footer>
</body>
</html>
