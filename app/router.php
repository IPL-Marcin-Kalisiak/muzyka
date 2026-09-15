<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$libraryDir = __DIR__ . '/library';
require_once __DIR__ . '/library_catalog.php';
$pianoScores = pianoScores($libraryDir);
require_once __DIR__ . '/guitar_catalog.php';
$guitarScores = guitarScores($libraryDir);

if ($path === '/api/guitar-score') {
    $selected = $_GET['file'] ?? null;
    if (!is_string($selected) || !isset($guitarScores[$selected])) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Nie znaleziono wybranej partytury gitary.'], JSON_UNESCAPED_UNICODE);
        return;
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    readfile($guitarScores[$selected]['path']);
    return;
}

if ($path === '/api/render-guitar') {
    header('Cache-Control: no-store');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        http_response_code(405);
        echo 'Wymagane żądanie POST z JSON.';
        return;
    }
    $request = json_decode(file_get_contents('php://input') ?: '', true);
    $selected = $request['file'] ?? null;
    if (!is_string($selected) || !isset($guitarScores[$selected])) {
        http_response_code(400);
        echo 'Nieprawidłowa partytura gitary.';
        return;
    }
    $root = dirname(__DIR__);
    $outputDir = $root . '/python/output';
    if (!is_dir($outputDir)) mkdir($outputDir, 0775, true);
    $output = $outputDir . '/' . bin2hex(random_bytes(12)) . '.wav';
    $command = [$root . '/python/runtime/python.exe', $root . '/python/render_guitar.py', '--score', $guitarScores[$selected]['path'], '--output', $output];
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
    if (!is_resource($process)) {
        http_response_code(500);
        echo 'Nie udało się uruchomić lokalnego Pythona.';
        return;
    }
    $result = stream_get_contents($pipes[1]); fclose($pipes[1]);
    $error = stream_get_contents($pipes[2]); fclose($pipes[2]);
    $exitCode = proc_close($process);
    if ($exitCode !== 0 || !is_file($output)) {
        if (is_file($output)) unlink($output);
        http_response_code(422);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Renderowanie gitary nie powiodło się: ' . trim($error ?: $result);
        return;
    }
    header('Content-Type: audio/wav');
    header('Content-Length: ' . filesize($output));
    header('Content-Disposition: inline; filename="' . pathinfo($selected, PATHINFO_FILENAME) . '.wav"');
    readfile($output);
    unlink($output);
    return;
}

if ($path === '/api/piano-level') {
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        http_response_code(405);
        echo json_encode(['error' => 'Wymagane żądanie POST z JSON.']);
        return;
    }
    $request = json_decode(file_get_contents('php://input') ?: '', true);
    $selected = $request['file'] ?? null;
    $balance = $request['balance'] ?? null;
    $model = $request['model'] ?? null;
    if (!is_string($selected) || !isset($pianoScores[$selected]) || !is_int($balance) || $balance < -100 || $balance > 100 || !in_array($model, ['ydp', 'upright-kw'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nieprawidłowa partytura, balans lub model.']);
        return;
    }
    $root = dirname(__DIR__);
    $outputDir = $root . '/python/output';
    if (!is_dir($outputDir)) mkdir($outputDir, 0775, true);
    $output = $outputDir . '/' . bin2hex(random_bytes(12)) . '.wav';
    $command = [$root . '/python/runtime/python.exe', $root . '/python/render_piano.py', '--score', $pianoScores[$selected]['path'], '--output', $output, '--balance', (string) $balance, '--model', $model, '--analyze'];
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
    if (!is_resource($process)) {
        http_response_code(500);
        echo json_encode(['error' => 'Nie udało się uruchomić analizy.']);
        return;
    }
    $result = stream_get_contents($pipes[1]); fclose($pipes[1]);
    $error = stream_get_contents($pipes[2]); fclose($pipes[2]);
    $exitCode = proc_close($process);
    if (is_file($output)) unlink($output);
    $analysis = json_decode($result ?: '', true);
    if ($exitCode !== 0 || !is_array($analysis) || !isset($analysis['peakDbfs'])) {
        http_response_code(422);
        echo json_encode(['error' => trim($error) ?: 'Nie udało się zmierzyć poziomu WAV.'], JSON_UNESCAPED_UNICODE);
        return;
    }
    echo json_encode($analysis);
    return;
}

if ($path === '/api/render-piano') {
    header('Cache-Control: no-store');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        http_response_code(405);
        echo 'Wymagane żądanie POST z JSON.';
        return;
    }
    $request = json_decode(file_get_contents('php://input') ?: '', true);
    $selected = $request['file'] ?? null;
    $balance = $request['balance'] ?? null;
    $model = $request['model'] ?? 'ydp';
    $gainDb = $request['gainDb'] ?? 0;
    if (!is_string($selected) || !isset($pianoScores[$selected]) || !is_int($balance) || $balance < -100 || $balance > 100 || !in_array($model, ['ydp', 'upright-kw'], true) || !is_int($gainDb) || $gainDb < -12 || $gainDb > 12) {
        http_response_code(400);
        echo 'Nieprawidłowa partytura, balans, model lub poziom pianina.';
        return;
    }
    $root = dirname(__DIR__);
    $python = $root . '/python/runtime/python.exe';
    $script = $root . '/python/render_piano.py';
    $outputDir = $root . '/python/output';
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0775, true);
    }
    $output = $outputDir . '/' . bin2hex(random_bytes(12)) . '.wav';
    $command = [$python, $script, '--score', $pianoScores[$selected]['path'], '--output', $output, '--balance', (string) $balance, '--model', $model, '--gain-db', (string) $gainDb];
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
    if (!is_resource($process)) {
        http_response_code(500);
        echo 'Nie udało się uruchomić lokalnego Pythona.';
        return;
    }
    $result = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $error = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);
    if ($exitCode !== 0 || !is_file($output)) {
        if (is_file($output)) unlink($output);
        http_response_code(422);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Renderowanie nie powiodło się: ' . trim($error);
        return;
    }
    header('Content-Type: audio/wav');
    $renderInfo = json_decode($result ?: '', true);
    if (is_array($renderInfo) && isset($renderInfo['appliedGainDb'])) {
        header('X-Applied-Gain-Db: ' . $renderInfo['appliedGainDb']);
    }
    header('Content-Length: ' . filesize($output));
    header('Content-Disposition: inline; filename="' . pathinfo($selected, PATHINFO_FILENAME) . '.wav"');
    readfile($output);
    unlink($output);
    return;
}

if ($path === '/api/piano-score') {
    $selected = $_GET['file'] ?? null;
    if (!is_string($selected) || !isset($pianoScores[$selected])) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Nie znaleziono wybranej partytury pianina.']);
        return;
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    readfile($pianoScores[$selected]['path']);
    return;
}

if (!in_array($path, ['/', '/index.php', '/piano', '/guitar'], true)) {
    http_response_code(404);
    echo 'Nie znaleziono strony.';
    return;
}

$songs = [];
foreach (glob($libraryDir . '/*.json') ?: [] as $file) {
    $songs[] = basename($file);
}
sort($songs, SORT_NATURAL | SORT_FLAG_CASE);

require __DIR__ . '/view/' . ($path === '/piano' ? 'piano.php' : ($path === '/guitar' ? 'guitar.php' : 'home.php'));
