<?php
declare(strict_types=1);

/** @return array<string, array{path: string, title: string, notes: int}> */
function violinScores(string $directory): array
{
    $scores = [];
    foreach (glob($directory . '/*.json') ?: [] as $path) {
        if (!is_file($path) || is_link($path)) continue;
        $score = json_decode(file_get_contents($path) ?: '', true);
        if (!is_array($score) || !is_array($score['tracks'] ?? null)) continue;
        $count = 0;
        foreach ($score['tracks'] as $track) {
            if (!is_array($track) || !is_string($track['instrument'] ?? null) || preg_match('/(^|_)violin($|_)/i', $track['instrument']) !== 1) continue;
            $count += is_array($track['notes'] ?? null) ? count($track['notes']) : 0;
            foreach ($track['voices'] ?? [] as $voice) $count += is_array($voice['notes'] ?? null) ? count($voice['notes']) : 0;
        }
        if ($count === 0) continue;
        $title = $score['project']['title'] ?? null;
        $scores[basename($path)] = ['path' => $path, 'title' => is_string($title) && trim($title) !== '' ? trim($title) : pathinfo($path, PATHINFO_FILENAME), 'notes' => $count];
    }
    uksort($scores, 'strnatcasecmp');
    return $scores;
}
