(() => {
  const keyboard = document.getElementById('piano-keyboard');
  if (!keyboard) return;
  const status = document.getElementById('note-status');
  const volume = document.getElementById('volume');
  const volumeValue = document.getElementById('volume-value');
  const white = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5'];
  const black = [['C#4',1],['D#4',2],['F#4',4],['G#4',5],['A#4',6],['C#5',8],['D#5',9],['F#5',11],['G#5',12],['A#5',13]];
  const shortcuts = {a:'C4',w:'C#4',s:'D4',e:'D#4',d:'E4',f:'F4',t:'F#4',g:'G4',y:'G#4',h:'A4',u:'A#4',j:'B4',k:'C5'};
  let audio;
  function frequency(note) {
    const match = note.match(/^([A-G])(#?)(\d)$/);
    const semitone = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]] + (match[2] ? 1 : 0);
    return 440 * 2 ** (((Number(match[3]) + 1) * 12 + semitone - 69) / 12);
  }
  function play(note, key) {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    const output = audio.createGain();
    output.gain.setValueAtTime(0.0001,now);
    output.gain.exponentialRampToValueAtTime(Math.max(Number(volume.value) / 100 * 0.18,0.0002),now+0.015);
    output.gain.exponentialRampToValueAtTime(0.0001,now+1.2);
    output.connect(audio.destination);
    [1,2,3].forEach((harmonic,index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency(note) * harmonic;
      gain.gain.value = [1,0.26,0.09][index];
      oscillator.connect(gain).connect(output);
      oscillator.start(now); oscillator.stop(now+1.22);
    });
    key.classList.add('active');
    setTimeout(() => key.classList.remove('active'),180);
    status.textContent = `Odtwarzanie: ${note}. Podgląd dźwięku w przeglądarce.`;
  }
  white.forEach(note => {
    const key = document.createElement('button'); key.type='button'; key.className='key white'; key.dataset.note=note;
    key.setAttribute('aria-label',`Zagraj ${note}`); if(note.startsWith('C')) key.textContent=note;
    key.addEventListener('pointerdown',() => play(note,key)); keyboard.appendChild(key);
  });
  black.forEach(([note,after]) => {
    const key = document.createElement('button'); key.type='button'; key.className='key black'; key.dataset.note=note;
    key.style.left=`${after/white.length*100}%`; key.setAttribute('aria-label',`Zagraj ${note}`);
    key.addEventListener('pointerdown',() => play(note,key)); keyboard.appendChild(key);
  });
  document.addEventListener('keydown',event => {
    if(event.repeat || event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
    const note=shortcuts[event.key.toLowerCase()];
    if(note){event.preventDefault();play(note,keyboard.querySelector(`[data-note="${note}"]`));}
  });
  volume.addEventListener('input',() => {volumeValue.textContent=`${volume.value}%`;});
})();
