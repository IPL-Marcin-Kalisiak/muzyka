(() => {
  const button = document.getElementById('render-guitar');
  if (!button) return;
  const scoreFile = document.getElementById('guitar-score-file');
  const engine = document.getElementById('guitar-render-engine');
  const status = document.getElementById('guitar-render-status');
  const preview = document.getElementById('guitar-render-preview');
  const download = document.getElementById('guitar-render-download');
  let previousUrl;

  function parseScore(score) {
    if (['0.4', '0.5'].includes(score.format_version)) throw new Error('Ta partytura z uderzeniami w gitarę wymaga brzmienia próbkowanego · Python + FluidSynth.');
    if (score.format !== 'MusicJSON' || score.format_version !== '0.3') throw new Error('Podgląd syntetyczny obsługuje gitarowy MusicJSON 0.3.');
    const ppq = score.global?.ticks_per_beat;
    const tempoMap = score.global?.tempo_map;
    if (!Number.isInteger(ppq) || ppq < 1 || !Array.isArray(tempoMap) || !tempoMap.length || tempoMap[0].tick !== 0) throw new Error('Brak poprawnego tempa MIDI.');
    const tempos = [];
    let accumulated = 0;
    for (const change of tempoMap) {
      if (!Number.isInteger(change.tick) || change.tick < 0 || !Number.isInteger(change.microseconds_per_beat) || change.microseconds_per_beat <= 0 || (tempos.length && change.tick <= tempos.at(-1).tick)) throw new Error('Nieprawidłowa mapa tempa MIDI.');
      if (tempos.length) accumulated += (change.tick - tempos.at(-1).tick) / ppq * tempos.at(-1).secondsPerBeat;
      tempos.push({ tick: change.tick, seconds: accumulated, secondsPerBeat: change.microseconds_per_beat / 1_000_000 });
    }
    const secondsAt = tick => {
      let current = tempos[0];
      for (const change of tempos) { if (change.tick > tick) break; current = change; }
      return current.seconds + (tick - current.tick) / ppq * current.secondsPerBeat;
    };
    const tracks = score.tracks?.filter(track => typeof track.instrument === 'string' && /(^|_)guitar($|_)/i.test(track.instrument)) ?? [];
    if (tracks.length !== 1 || !Array.isArray(tracks[0].notes)) throw new Error('Oczekiwano jednej ścieżki gitary z nutami.');
    const sourceNotes = tracks[0].notes;
    if (!sourceNotes.length || sourceNotes.length > 10000) throw new Error('Partytura gitary jest pusta lub zbyt duża.');
    const notes = sourceNotes.map((note, index) => {
      const { midi_note: midi, start_tick: start, duration_ticks: duration, velocity } = note;
      if (!Number.isInteger(midi) || midi < 0 || midi > 127 || !Number.isInteger(start) || start < 0 || !Number.isInteger(duration) || duration <= 0 || !Number.isInteger(velocity) || velocity < 0 || velocity > 127) throw new Error(`Nieprawidłowa nuta ${index + 1}.`);
      const startSeconds = secondsAt(start);
      return { frequency: 440 * 2 ** ((midi - 69) / 12), start: startSeconds, duration: secondsAt(start + duration) - startSeconds, velocity };
    });
    const length = Math.max(...notes.map(note => note.start + note.duration)) + 0.3;
    if (length > 600) throw new Error('Partytura przekracza 10 minut podglądu.');
    return { notes, length };
  }

  function synthesize({ notes, length }) {
    const sampleRate = 44100;
    const samples = new Float32Array(Math.ceil(length * sampleRate));
    const twoPi = 2 * Math.PI;
    for (const note of notes) {
      if (!note.velocity) continue;
      const first = Math.round(note.start * sampleRate);
      const count = Math.min(samples.length - first, Math.ceil((note.duration + 0.18) * sampleRate));
      const amplitude = note.velocity / 127 * 0.085;
      for (let i = 0; i < count; i++) {
        const time = i / sampleRate;
        const attack = Math.min(1, time / 0.006);
        const release = time <= note.duration ? 1 : Math.max(0, 1 - (time - note.duration) / 0.18);
        const decay = Math.exp(-time * (1.7 + note.frequency / 700));
        const phase = twoPi * note.frequency * time;
        samples[first + i] += amplitude * attack * release * decay * (Math.sin(phase) + 0.26 * Math.sin(2 * phase) + 0.10 * Math.sin(3 * phase));
      }
    }
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    const scale = peak > 0.891 ? 0.891 / peak : 1;
    return encodeWav(samples, sampleRate, scale);
  }

  function encodeWav(samples, rate, scale) {
    const bytes = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(bytes);
    const word = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    word(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); word(36, 'data'); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const value = Math.max(-1, Math.min(1, samples[i] * scale));
      view.setInt16(44 + i * 2, value < 0 ? value * 32768 : value * 32767, true);
    }
    return new Blob([bytes], { type: 'audio/wav' });
  }

  const reset = () => {
    preview.pause(); preview.hidden = true; download.hidden = true;
    status.textContent = 'Wygeneruj plik WAV z wybranego brzmienia.';
  };
  scoreFile?.addEventListener('change', reset);
  engine?.addEventListener('change', reset);
  button.addEventListener('click', async () => {
    button.disabled = true;
    if (scoreFile) scoreFile.disabled = true;
    if (engine) engine.disabled = true;
    preview.hidden = true; download.hidden = true;
    status.textContent = 'Wczytywanie i sprawdzanie partytury gitary…';
    try {
      if (!scoreFile?.value) throw new Error('Wybierz partyturę gitary.');
      const selected = scoreFile.value;
      let wav;
      let description;
      if (engine.value === 'sampled') {
        status.textContent = 'Python i FluidSynth renderują próbki gitary. To może potrwać chwilę…';
        const response = await fetch('/api/render-guitar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: selected }) });
        if (!response.ok) throw new Error(await response.text() || 'Nie udało się wyrenderować gitary.');
        wav = await response.blob();
        description = 'Gitara próbkowana jest gotowa.';
      } else {
        const response = await fetch(`/api/guitar-score?file=${encodeURIComponent(selected)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Nie udało się wczytać gitarowego JSON.');
        const score = parseScore(await response.json());
        status.textContent = `Synteza ${score.notes.length} nut. To może potrwać chwilę…`;
        await new Promise(resolve => setTimeout(resolve, 20));
        wav = synthesize(score);
        description = `Podgląd syntetyczny: ${score.notes.length} nut, około ${Math.round(score.length)} s.`;
      }
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      previousUrl = URL.createObjectURL(wav);
      preview.src = previousUrl; preview.hidden = false;
      download.href = previousUrl; download.download = selected.replace(/\.json$/i, '.wav'); download.hidden = false;
      status.textContent = `${description} Możesz odsłuchać lub pobrać WAV.`;
    } catch (error) {
      status.textContent = `Nie udało się wygenerować gitary: ${error.message}`;
    } finally {
      button.disabled = false;
      if (scoreFile) scoreFile.disabled = false;
      if (engine) engine.disabled = false;
    }
  });
})();
