(() => {
  const button = document.getElementById('render-score');
  if (!button) return;
  const status = document.getElementById('render-status');
  const preview = document.getElementById('render-preview');
  const download = document.getElementById('render-download');
  const balance = document.getElementById('hand-balance');
  const balanceValue = document.getElementById('hand-balance-value');
  const scoreFile = document.getElementById('score-file');
  const engine = document.getElementById('render-engine');
  const outputGain = document.getElementById('output-gain');
  const outputGainValue = document.getElementById('output-gain-value');
  const levelWarning = document.getElementById('level-warning');
  let previousUrl;
  let hasRenderedSelection = false;
  let analyzedPeak = null;
  let analysisRequest = 0;

  function showLevelWarning() {
    const gain = Number(outputGain.value);
    outputGainValue.textContent = `${gain > 0 ? '+' : ''}${gain} dB`;
    if (analyzedPeak === null) return;
    const projected = analyzedPeak + gain;
    const peakText = `${projected.toFixed(1).replace('.', ',')} dBFS`;
    if (analyzedPeak >= -0.1) {
      levelWarning.dataset.level = 'loud';
      levelWarning.textContent = `Ten render już osiąga 0 dBFS. Poziom źródła może być przesterowany; końcowy WAV zostanie ograniczony do −1 dBFS. Żądany poziom: ${peakText}.`;
    } else if (projected > -1) {
      levelWarning.dataset.level = 'loud';
      levelWarning.textContent = `Może być za głośno: przewidywany szczyt ${peakText}. Eksport ograniczy wzmocnienie do −1 dBFS.`;
    } else if (projected < -12) {
      levelWarning.dataset.level = 'quiet';
      levelWarning.textContent = `Może być za cicho: przewidywany szczyt ${peakText}. Możesz podnieść poziom końcowy.`;
    } else {
      levelWarning.dataset.level = 'safe';
      levelWarning.textContent = `Poziom wygląda bezpiecznie: przewidywany szczyt ${peakText}.`;
    }
  }

  async function analyzeLevel() {
    const requestId = ++analysisRequest;
    analyzedPeak = null;
    if (!scoreFile?.value) {
      levelWarning.textContent = 'Brak partytury do analizy.';
      return;
    }
    if (engine.value === 'synthetic') {
      levelWarning.textContent = 'Poziom podglądu syntetycznego sprawdzę po wygenerowaniu WAV.';
      levelWarning.dataset.level = '';
      return;
    }
    levelWarning.textContent = 'Analizuję wybraną partyturę, model i balans…';
    levelWarning.dataset.level = '';
    try {
      const response = await fetch('/api/piano-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: scoreFile.value, model: engine.value === 'upright-kw' ? 'upright-kw' : 'ydp', balance: Number(balance.value) }),
      });
      if (!response.ok) throw new Error('Nie udało się zmierzyć poziomu.');
      const analysis = await response.json();
      if (requestId !== analysisRequest) return;
      analyzedPeak = Number(analysis.peakDbfs);
      if (!Number.isFinite(analyzedPeak)) throw new Error('Nieprawidłowy pomiar poziomu.');
      showLevelWarning();
    } catch (error) {
      if (requestId !== analysisRequest) return;
      levelWarning.textContent = `${error.message} Ostrzeżenie pojawi się po renderowaniu.`;
    }
  }

  function pitchFrequency(pitch) {
    const match = /^([A-G])([#b]?)([0-8])$/.exec(pitch);
    if (!match) throw new Error(`Nieprawidłowa wysokość nuty: ${pitch}`);
    const steps = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const midi = (Number(match[3]) + 1) * 12 + steps[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
    return 440 * 2 ** ((midi - 69) / 12);
  }

  function parseScore(score) {
    if (['0.2', '0.3'].includes(score.format_version) && score.global?.ticks_per_beat && !score.global?.time_unit) {
      throw new Error('Partytura z czasem w tickach MIDI wymaga brzmienia „Fortepian próbkowany · Python + FluidSynth”.');
    }
    if (score.format !== 'MusicJSON' || score.global?.time_unit !== 'eighth_note') {
      throw new Error('Ta wersja obsługuje MusicJSON z czasem liczonym w ósemkach.');
    }
    const tracks = score.tracks?.filter(track => typeof track.instrument === 'string' && /(^|_)piano($|_)/i.test(track.instrument)) ?? [];
    if (tracks.length !== 1) throw new Error('Oczekiwano jednej ścieżki pianina.');
    const notes = tracks[0].voices?.flatMap(voice => (voice.notes ?? []).map(note => ({ ...note, hand: voice.id === 'right_hand' || voice.id === 'left_hand' ? voice.id : 'other' }))) ?? (tracks[0].notes ?? []).map(note => ({ ...note, hand: 'other' }));
    if (!notes.length || notes.length > 10000) throw new Error('Partytura pianina jest pusta lub zbyt duża.');
    const measureStarts = new Map();
    for (const note of notes) {
      if (Number.isInteger(note.measure) && note.measure >= 1) {
        measureStarts.set(note.measure, Math.min(measureStarts.get(note.measure) ?? Infinity, Number(note.start)));
      }
    }
    const rawTempos = score.global.tempo_map ?? [{ bar: 1, bpm: score.global.tempo?.bpm, beat_unit: score.global.tempo?.beat_unit }];
    if (!Array.isArray(rawTempos) || !rawTempos.length) throw new Error('Brak mapy tempa.');
    const tempos = [];
    for (const change of rawTempos) {
      const bpm = Number(change.bpm);
      const unit = change.beat_unit ?? (score.global.tempo_map ? 'quarter' : undefined);
      if (!Number.isInteger(change.bar) || change.bar < 1 || !Number.isFinite(bpm) || bpm <= 0 || bpm > 300 || !['eighth', 'quarter'].includes(unit) || (tempos.length && change.bar <= tempos.at(-1).bar)) throw new Error('Nieprawidłowa mapa tempa.');
      const candidates = [...measureStarts].filter(([measure]) => measure >= change.bar).map(([, start]) => start);
      const signature = score.global.time_signature;
      const unitsPerBar = signature?.numerator * 8 / signature?.denominator;
      const start = change.bar === 1 ? 0 : candidates.length ? Math.min(...candidates) : Number.isFinite(unitsPerBar) ? (change.bar - 1) * unitsPerBar : Infinity;
      if (!Number.isFinite(start)) throw new Error('Nie można wyznaczyć początku zmiany tempa.');
      tempos.push({ bar: change.bar, start, secondsPerUnit: (unit === 'eighth' ? 60 : 30) / bpm });
    }
    if (tempos[0].bar !== 1) throw new Error('Mapa tempa musi zaczynać się od taktu 1.');
    function secondsAt(unit) {
      let seconds = 0;
      for (let i = 0; i < tempos.length; i++) {
        const current = tempos[i];
        if (unit <= current.start) break;
        seconds += (Math.min(unit, tempos[i + 1]?.start ?? unit) - current.start) * current.secondsPerUnit;
        if (!tempos[i + 1] || unit < tempos[i + 1].start) break;
      }
      return seconds;
    }
    const parsed = notes.map((note, index) => {
      const start = Number(note.start);
      const duration = Number(note.duration);
      const velocity = Number(note.velocity ?? 80);
      if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration <= 0 || !Number.isInteger(velocity) || velocity < 0 || velocity > 127) {
        throw new Error(`Nieprawidłowy czas lub dynamika nuty ${index + 1}.`);
      }
      return { frequency: pitchFrequency(note.pitch), start: secondsAt(start), duration: secondsAt(start + duration) - secondsAt(start), velocity, hand: note.hand };
    });
    const length = Math.max(...parsed.map(note => note.start + note.duration)) + 0.5;
    if (length > 600) throw new Error('Utwór przekracza limit 10 minut dla podglądu.');
    return { notes: parsed, length };
  }

  function handLevels(notes, position) {
    const hasRight = notes.some(note => note.hand === 'right_hand');
    const hasLeft = notes.some(note => note.hand === 'left_hand');
    if (!hasRight || !hasLeft) return { right_hand: 1, left_hand: 1, other: 1 };
    const rms = hand => {
      const values = notes.filter(note => note.hand === hand && note.velocity > 0).map(note => note.velocity);
      if (!values.length) throw new Error(`Brak nut głosu ${hand} do ustawienia balansu.`);
      return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
    };
    const rightRms = rms('right_hand');
    const leftRms = rms('left_hand');
    const target = (rightRms + leftRms) / 2;
    const amount = Math.min(1, Math.abs(Number(position)) / 100);
    const quieterHand = (1 - amount) ** 2;
    return {
      right_hand: target / rightRms * (position < 0 ? quieterHand : 1),
      left_hand: target / leftRms * (position > 0 ? quieterHand : 1),
      other: 1,
    };
  }

  async function synthesize({ notes, length }, position) {
    const sampleRate = 44100;
    const context = new OfflineAudioContext(1, Math.ceil(length * sampleRate), sampleRate);
    const levels = handLevels(notes, position);
    for (const note of notes) {
      if (note.velocity === 0 || levels[note.hand] === 0) continue;
      const gain = context.createGain();
      const peak = note.velocity / 127 * 0.13 * levels[note.hand];
      gain.gain.setValueAtTime(0.0001, note.start);
      gain.gain.linearRampToValueAtTime(peak, note.start + 0.012);
      gain.gain.exponentialRampToValueAtTime(Math.max(peak * 0.35, 0.0002), note.start + Math.min(note.duration, 0.35));
      gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.duration + 0.3);
      gain.connect(context.destination);
      [1, 2, 3].forEach((partial, index) => {
        const oscillator = context.createOscillator();
        const partialGain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = note.frequency * partial;
        partialGain.gain.value = [1, 0.22, 0.07][index];
        oscillator.connect(partialGain).connect(gain);
        oscillator.start(note.start);
        oscillator.stop(note.start + note.duration + 0.31);
      });
    }
    return context.startRendering();
  }

  balance.addEventListener('input', () => {
    const position = Number(balance.value);
    balanceValue.textContent = position === 0 ? 'Równowaga' : position === -100 ? 'Tylko lewa' : position === 100 ? 'Tylko prawa' : position < 0 ? `${Math.abs(position)}% w lewo` : `${position}% w prawo`;
    if (!preview.hidden) {
      preview.pause();
      preview.hidden = true;
      download.hidden = true;
      status.textContent = 'Balans zmieniony. Aktualizuję odsłuch po puszczeniu suwaka…';
    }
  });

  balance.addEventListener('change', () => {
    analyzeLevel();
    if (hasRenderedSelection) renderScore();
  });

  scoreFile?.addEventListener('change', () => {
    hasRenderedSelection = false;
    preview.pause();
    preview.hidden = true;
    download.hidden = true;
    status.textContent = `Wybrano ${scoreFile.value}. Wygeneruj plik WAV.`;
    analyzeLevel();
  });
  engine?.addEventListener('change', () => {
    hasRenderedSelection = false;
    preview.pause();
    preview.hidden = true;
    download.hidden = true;
    status.textContent = 'Zmieniono brzmienie. Wygeneruj plik WAV.';
    analyzeLevel();
  });

  outputGain.addEventListener('input', () => {
    showLevelWarning();
    if (!preview.hidden) {
      preview.pause(); preview.hidden = true; download.hidden = true;
      status.textContent = 'Poziom zmieniony. Aktualizuję WAV po puszczeniu suwaka…';
    }
  });
  outputGain.addEventListener('change', () => {
    if (hasRenderedSelection) renderScore();
  });

  function toWav(buffer, gainDb) {
    const samples = buffer.getChannelData(0);
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    const peakDbfs = peak ? 20 * Math.log10(peak) : -120;
    const appliedGainDb = peak ? Math.min(gainDb, -1 - peakDbfs) : gainDb;
    const factor = 10 ** (appliedGainDb / 20);
    const bytes = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(bytes);
    const write = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); write(8, 'WAVE'); write(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i] * factor));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return { blob: new Blob([bytes], { type: 'audio/wav' }), peakDbfs, appliedGainDb };
  }

  async function renderScore() {
    button.disabled = true;
    if (scoreFile) scoreFile.disabled = true;
    engine.disabled = true;
    balance.disabled = true;
    outputGain.disabled = true;
    preview.hidden = true; download.hidden = true;
    status.textContent = 'Wczytywanie i sprawdzanie partytury…';
    try {
      if (!scoreFile?.value) throw new Error('Wybierz partyturę pianina.');
      const selectedFile = scoreFile.value;
      const position = Number(balance.value);
      const gainDb = Number(outputGain.value);
      let wav;
      let detail;
      let appliedGainDb = gainDb;
      if (engine.value !== 'synthetic') {
        const model = engine.value === 'upright-kw' ? 'upright-kw' : 'ydp';
        status.textContent = 'Python renderuje wybrany fortepian z próbek…';
        const response = await fetch('/api/render-piano', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: selectedFile, balance: position, model, gainDb }),
        });
        if (!response.ok) throw new Error((await response.text()).slice(0, 300));
        wav = await response.blob();
        appliedGainDb = Number(response.headers.get('X-Applied-Gain-Db') ?? gainDb);
        detail = model === 'upright-kw' ? 'Kawai Upright KW' : 'YDP Grand Piano';
      } else {
        const response = await fetch(`/api/piano-score?file=${encodeURIComponent(selectedFile)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Nie udało się wczytać partytury JSON.');
        const score = parseScore(await response.json());
        status.textContent = `Renderowanie ${score.notes.length} nut…`;
        const rendered = toWav(await synthesize(score, position), gainDb);
        wav = rendered.blob;
        appliedGainDb = rendered.appliedGainDb;
        analyzedPeak = rendered.peakDbfs;
        showLevelWarning();
        detail = `${score.notes.length} nut, około ${Math.round(score.length)} s, podgląd syntetyczny`;
      }
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      previousUrl = URL.createObjectURL(wav);
      preview.src = previousUrl; preview.hidden = false;
      download.href = previousUrl; download.download = selectedFile.replace(/\.json$/i, engine.value === 'upright-kw' ? '-upright-kw.wav' : '.wav'); download.hidden = false;
      const limited = appliedGainDb < gainDb - 0.05;
      status.textContent = `Gotowe: ${detail}. Balans: ${balanceValue.textContent}. Poziom WAV: ${appliedGainDb > 0 ? '+' : ''}${appliedGainDb.toFixed(1)} dB${limited ? ' (ograniczony dla ochrony przed przesterowaniem)' : ''}. Możesz odsłuchać lub pobrać WAV.`;
      hasRenderedSelection = true;
    } catch (error) {
      status.textContent = `Nie udało się wygenerować audio: ${error.message}`;
      hasRenderedSelection = false;
    } finally {
      button.disabled = false;
      if (scoreFile) scoreFile.disabled = false;
      engine.disabled = false;
      balance.disabled = false;
      outputGain.disabled = false;
    }
  }

  button.addEventListener('click', renderScore);
  analyzeLevel();
})();
