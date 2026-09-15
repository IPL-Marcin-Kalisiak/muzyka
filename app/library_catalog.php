<?php
declare(strict_types=1);

/** @return array<string, array{path: string, title: string, notes: int}> */
function pianoScores(string $directory): array
{
    $scores = [];
    foreach (glob($directory . '/*.json') ?: [] as $path) {
        if (!is_file($path) || is_link($path)) {
            continue;
        }
        $contents = file_get_contents($path);
        if ($contents === false) {
            continue;
        }
        $score = json_decode($contents, true);
        if (!is_array($score) || !isset($score['tracks']) || !is_array($score['tracks'])) {
            continue;
        }
        $pianoTracks = array_filter($score['tracks'], static function ($track): bool {
            if (!is_array($track)) {
                return false;
            }
            $instrument = $track['instrument'] ?? null;
            return is_string($instrument) && preg_match('/(^|_)piano($|_)/i', $instrument) === 1;
        });
        if ($pianoTracks === []) {
            continue;
        }
        $notes = 0;
        foreach ($pianoTracks as $track) {
            if (isset($track['voices']) && is_array($track['voices'])) {
                foreach ($track['voices'] as $voice) {
                    $notes += is_array($voice['notes'] ?? null) ? count($voice['notes']) : 0;
                }
            } elseif (is_array($track['notes'] ?? null)) {
                $notes += count($track['notes']);
            }
        }
        $title = $score['project']['title'] ?? null;
        $scores[basename($path)] = [
            'path' => $path,
            'title' => is_string($title) && trim($title) !== '' ? trim($title) : pathinfo($path, PATHINFO_FILENAME),
            'notes' => $notes,
        ];
    }
    uksort($scores, 'strnatcasecmp');
    return $scores;
}
