(() => {
  const fretboard = document.getElementById('guitar-fretboard');
  if (!fretboard) return;
  const status = document.getElementById('guitar-note-status');
  const volume = document.getElementById('guitar-volume');
  const volumeValue = document.getElementById('guitar-volume-value');
  const strings = [
    { name: 'E4', midi: 64, number: 1 },
    { name: 'B3', midi: 59, number: 2 },
    { name: 'G3', midi: 55, number: 3 },
    { name: 'D3', midi: 50, number: 4 },
    { name: 'A2', midi: 45, number: 5 },
    { name: 'E2', midi: 40, number: 6 },
  ];
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  let audio;
  function noteName(midi) {
    return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }
  function play(midi, button, stringNumber, fret) {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const envelope = audio.createGain();
    const peak = Math.max(0.0002, Number(volume.value) / 100 * 0.15);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(peak, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    envelope.connect(audio.destination);
    [1, 2, 3].forEach((partial, index) => {
      const oscillator = audio.createOscillator();
      const harmonic = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial;
      harmonic.gain.value = [1, 0.28, 0.12][index];
      oscillator.connect(harmonic).connect(envelope);
      oscillator.start(now); oscillator.stop(now + 1.37);
    });
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 180);
    status.textContent = `Struna ${stringNumber}, próg ${fret}: ${noteName(midi)}. Syntetyczny podgląd gitary.`;
  }
  for (const string of strings) {
    const row = document.createElement('div');
    row.className = `fret-row string-${string.number}`;
    const label = document.createElement('span');
    label.className = 'string-label'; label.textContent = `${string.number} · ${string.name}`;
    row.appendChild(label);
    for (let fret = 0; fret <= 12; fret++) {
      const midi = string.midi + fret;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'fret-note';
      button.textContent = fret === 0 ? '0' : String(fret);
      button.title = noteName(midi);
      button.setAttribute('aria-label', `Struna ${string.number}, próg ${fret}, nuta ${noteName(midi)}`);
      button.addEventListener('click', () => play(midi, button, string.number, fret));
      row.appendChild(button);
    }
    fretboard.appendChild(row);
  }
  volume.addEventListener('input', () => { volumeValue.textContent = `${volume.value}%`; });
})();
