let AC = null;

export function initAudio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
  }
}

function tone(freqA, freqB, dur, type, vol) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqA, AC.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(freqB, 1), AC.currentTime + dur);
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(); o.stop(AC.currentTime + dur);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!AC) return;
  const n = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, n, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterFreq;
  const g = AC.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(AC.destination);
  src.start();
}

export const sfx = {
  fire:   () => tone(340, 90, 0.18, "square", 0.12),
  hit:    () => { tone(150, 60, 0.12, "triangle", 0.25); noiseBurst(0.08, 0.15, 1800); },
  splash: () => noiseBurst(0.35, 0.28, 900),
  ko:     () => tone(420, 55, 0.45, "sawtooth", 0.16),
  cash:   () => { tone(880, 880, 0.07, "sine", 0.15); setTimeout(() => tone(1320, 1320, 0.12, "sine", 0.15), 80); },
  win:    () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, f, 0.18, "triangle", 0.18), i * 130)); },
  lose:   () => { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, f * 0.9, 0.25, "sawtooth", 0.12), i * 160)); },
  boom:   () => { noiseBurst(0.5, 0.5, 420); tone(95, 28, 0.45, "sawtooth", 0.3); },
  buy:    () => { [659, 880, 1175].forEach((f, i) => setTimeout(() => tone(f, f, 0.1, "sine", 0.16), i * 70)); },
  deny:   () => tone(160, 80, 0.22, "square", 0.16),
};
