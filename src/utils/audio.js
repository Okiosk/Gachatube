/**
 * Web Audio API procedural sound effects for booster pack opening and cards
 */

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

/**
 * Sound effect: Tearing open the booster pack foil
 */
export function playTearSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.45; // 450ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate crisp ripping noise
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const crackle = Math.random() > 0.6 ? 1 : -1;
    // Envelope: rising burst then fading
    const env = Math.sin(t * Math.PI) * (1 - t * 0.4);
    data[i] = (Math.random() * 2 - 1) * crackle * env * 0.35;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.45);
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
}

/**
 * Sound effect: Card slide / whoosh when revealing
 */
export function playCardSlideSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

/**
 * Sound effect: Holographic crystalline twinkle for Rare & Ultra Rare cards
 */
export function playHoloShineSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 major arpeggio
  const now = ctx.currentTime;

  freqs.forEach((f, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + index * 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.setValueAtTime(0.18, now + index * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.04);
    osc.stop(now + index * 0.04 + 0.35);
  });
}

/**
 * Sound effect: Triumphant fanfare for Mythique / Secret Rare pulls!
 */
export function playMythicFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 440.0, time: 0.0, dur: 0.12 },    // A4
    { freq: 554.37, time: 0.12, dur: 0.12 },  // C#5
    { freq: 659.25, time: 0.24, dur: 0.12 },  // E5
    { freq: 880.0, time: 0.36, dur: 0.45 },   // A5 (high peak)
    { freq: 1108.73, time: 0.50, dur: 0.5 },  // C#6 (victory chime)
  ];

  const now = ctx.currentTime;

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.setValueAtTime(0.2, now + time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now + time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });

  // Add sparkling chimes in background
  setTimeout(() => {
    playHoloShineSound();
  }, 250);
}

/**
 * Button click sound
 */
export function playClickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Combat sound: Attack impact hit
 */
export function playAttackHitSound(isCrit = false) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = isCrit ? 'sawtooth' : 'triangle';
  osc.frequency.setValueAtTime(isCrit ? 380 : 220, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + (isCrit ? 0.22 : 0.14));

  gain.gain.setValueAtTime(isCrit ? 0.4 : 0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.22 : 0.14));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (isCrit ? 0.22 : 0.14));
}

/**
 * Combat sound: Shield / Moderation activation
 */
export function playShieldSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.18);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Combat sound: Viral special attack / Buzz unleashed
 */
export function playSpecialBuzzSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [350, 520, 780, 1040];
  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.05 + 0.35);

    gain.gain.setValueAtTime(0.12, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.35);
  });
}

/**
 * Combat sound: Victory fanfare
 */
export function playVictoryJingle() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 440, time: 0.00, dur: 0.12 }, // A4
    { freq: 554, time: 0.12, dur: 0.12 }, // C#5
    { freq: 659, time: 0.24, dur: 0.14 }, // E5
    { freq: 880, time: 0.38, dur: 0.35 }, // A5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.25, now + time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Combat sound: Defeat low chime
 */
export function playDefeatSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.5);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

