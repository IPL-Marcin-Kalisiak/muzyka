(() => {
  const input = document.getElementById('mixer-files');
  if (!input) return;
  const list = document.getElementById('mixer-tracks');
  const drop = document.getElementById('mixer-drop');
  const status = document.getElementById('mixer-status');
  const playAll = document.getElementById('mixer-play-all');
  const stopButton = document.getElementById('mixer-stop');
  const exportButton = document.getElementById('mixer-export');
  const master = document.getElementById('mixer-master');
  const masterValue = document.getElementById('mixer-master-value');
  const clock = document.getElementById('mixer-clock');
  const progress = document.getElementById('mixer-progress-bar');
  const download = document.getElementById('mixer-download');
  const tracks = [];
  let context;
  let sources = [];
  let startedAt = 0;
  let playingDuration = 0;
  let timer;
  let mixUrl;
  let activeMasterGain;

  const formatTime = seconds => {
    const whole = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
  };
  const maxDuration = () => Math.max(0, ...tracks.map(track => track.buffer.duration));

  function updateControls() {
    const available = tracks.length > 0;
    playAll.disabled = !available;
    stopButton.disabled = !available;
    exportButton.disabled = !available;
    drop.hidden = available;
    clock.textContent = `00:00 / ${formatTime(maxDuration())}`;
    progress.style.width = '0%';
  }

  function stopPlayback(message) {
    sources.forEach(({ source }) => { try { source.stop(); } catch {} });
    sources = [];
    if (activeMasterGain) activeMasterGain.disconnect();
    activeMasterGain = undefined;
    clearInterval(timer);
    timer = undefined;
    clock.textContent = `00:00 / ${formatTime(maxDuration())}`;
    progress.style.width = '0%';
    tracks.forEach(track => track.row.classList.remove('playing'));
    if (message) status.textContent = message;
  }

  function setAudioParam(param, value) {
    if (!context) return;
    param.cancelScheduledValues(context.currentTime);
    param.setTargetAtTime(value, context.currentTime, 0.015);
  }

  function updateLiveTrackGain(track) {
    const value = track.muted ? 0 : track.gain;
    sources.filter(item => item.track === track).forEach(item => setAudioParam(item.gain.gain, value));
  }

  async function audioContext() {
    context ??= new AudioContext();
    if (context.state === 'suspended') await context.resume();
    return context;
  }

  async function play(selectedTracks, description) {
    stopPlayback();
    const ctx = await audioContext();
    activeMasterGain = ctx.createGain();
    activeMasterGain.gain.value = Number(master.value) / 100;
    activeMasterGain.connect(ctx.destination);
    playingDuration = Math.max(...selectedTracks.map(track => track.buffer.duration));
    startedAt = ctx.currentTime + 0.04;
    for (const track of selectedTracks) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = track.buffer;
      gain.gain.value = track.muted ? 0 : track.gain;
      source.connect(gain).connect(activeMasterGain);
      source.start(startedAt);
      sources.push({ source, gain, track });
      track.row.classList.add('playing');
    }
    status.textContent = description;
    timer = setInterval(() => {
      const elapsed = Math.max(0, ctx.currentTime - startedAt);
      clock.textContent = `${formatTime(Math.min(elapsed, playingDuration))} / ${formatTime(playingDuration)}`;
      progress.style.width = `${Math.min(100, elapsed / playingDuration * 100)}%`;
      if (elapsed >= playingDuration) stopPlayback('Odtwarzanie zakończone.');
    }, 100);
  }

  function renderTrack(track, index) {
    const row = document.createElement('article');
    row.className = 'mixer-track';
    row.innerHTML = `<span class="mixer-track-number">${String(index + 1).padStart(2, '0')}</span><div class="mixer-track-name"><strong></strong><small></small></div><button class="mixer-track-play" type="button" aria-label="Odtwórz osobno">▶ Solo</button><button class="mixer-track-mute" type="button" aria-pressed="false">Wycisz</button><label>Poziom <output>100%</output><input type="range" min="0" max="125" value="100"></label><button class="mixer-track-remove" type="button" aria-label="Usuń ścieżkę">×</button>`;
    row.querySelector('strong').textContent = track.name;
    row.querySelector('small').textContent = `${formatTime(track.buffer.duration)} · ${track.buffer.numberOfChannels === 1 ? 'mono' : 'stereo'} · ${(track.buffer.sampleRate / 1000).toFixed(1)} kHz`;
    const gain = row.querySelector('input');
    const gainValue = row.querySelector('output');
    gain.addEventListener('input', () => {
      track.gain = Number(gain.value) / 100;
      gainValue.textContent = `${gain.value}%`;
      updateLiveTrackGain(track);
    });
    row.querySelector('.mixer-track-play').addEventListener('click', () => play([track], `Odtwarzanie osobno: ${track.name}`));
    const mute = row.querySelector('.mixer-track-mute');
    mute.addEventListener('click', () => {
      track.muted = !track.muted;
      mute.setAttribute('aria-pressed', String(track.muted));
      mute.textContent = track.muted ? 'Wyciszona' : 'Wycisz';
      row.classList.toggle('muted', track.muted);
      updateLiveTrackGain(track);
    });
    row.querySelector('.mixer-track-remove').addEventListener('click', () => {
      stopPlayback();
      tracks.splice(tracks.indexOf(track), 1);
      drawTracks();
      status.textContent = `Usunięto ścieżkę ${track.name}.`;
    });
    track.row = row;
    return row;
  }

  function drawTracks() {
    list.replaceChildren(...tracks.map(renderTrack));
    updateControls();
  }

  async function addFiles(files) {
    stopPlayback();
    const ctx = await audioContext();
    let added = 0;
    const errors = [];
    status.textContent = 'Odczytuję pliki WAV…';
    for (const file of files) {
      try {
        if (!/\.wav$/i.test(file.name)) throw new Error('wymagany jest WAV');
        const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
        tracks.push({ name: file.name, buffer, gain: 1, muted: false });
        added++;
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }
    drawTracks();
    status.textContent = errors.length ? `Dodano ${added}. Pominięto: ${errors.join('; ')}` : `Dodano ${added} ${added === 1 ? 'ścieżkę' : 'ścieżki'}.`;
    input.value = '';
  }

  function encodeWav(buffer) {
    const channels = Math.min(2, buffer.numberOfChannels);
    const bytes = new ArrayBuffer(44 + buffer.length * channels * 2);
    const view = new DataView(bytes);
    const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    text(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, buffer.length * channels * 2, true);
    let offset = 44;
    for (let frame = 0; frame < buffer.length; frame++) for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame]));
      view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true); offset += 2;
    }
    return new Blob([bytes], { type: 'audio/wav' });
  }

  async function exportMix() {
    stopPlayback();
    exportButton.disabled = true;
    status.textContent = 'Łączę ścieżki i przygotowuję WAV…';
    try {
      const sampleRate = Math.max(...tracks.map(track => track.buffer.sampleRate));
      const length = Math.ceil(maxDuration() * sampleRate);
      const offline = new OfflineAudioContext(2, length, sampleRate);
      const masterGain = offline.createGain();
      masterGain.gain.value = Number(master.value) / 100;
      masterGain.connect(offline.destination);
      for (const track of tracks) {
        if (track.muted) continue;
        const source = offline.createBufferSource();
        const gain = offline.createGain();
        source.buffer = track.buffer; gain.gain.value = track.gain;
        source.connect(gain).connect(masterGain); source.start(0);
      }
      const result = await offline.startRendering();
      const wav = encodeWav(result);
      if (mixUrl) URL.revokeObjectURL(mixUrl);
      mixUrl = URL.createObjectURL(wav);
      download.href = mixUrl;
      download.click();
      status.textContent = `Gotowe: połączono ${tracks.filter(track => !track.muted).length} ścieżki, ${formatTime(result.duration)}.`;
    } catch (error) {
      status.textContent = `Nie udało się połączyć ścieżek: ${error.message}`;
    } finally { exportButton.disabled = tracks.length === 0; }
  }

  input.addEventListener('change', () => addFiles([...input.files]));
  playAll.addEventListener('click', () => play(tracks, `Wspólne odtwarzanie ${tracks.filter(track => !track.muted).length} ścieżek.`));
  stopButton.addEventListener('click', () => stopPlayback('Odtwarzanie zatrzymane.'));
  exportButton.addEventListener('click', exportMix);
  master.addEventListener('input', () => {
    masterValue.textContent = `${master.value}%`;
    if (activeMasterGain) setAudioParam(activeMasterGain.gain, Number(master.value) / 100);
  });
  for (const event of ['dragenter', 'dragover']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.add('dragging'); });
  for (const event of ['dragleave', 'drop']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.remove('dragging'); });
  drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
  drop.addEventListener('click', () => input.click());
  updateControls();
})();
