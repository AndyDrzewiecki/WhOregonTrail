// Lightweight ambient atmosphere using Web Audio API
// No audio files — generated tones only
// Fails silently if Web Audio not supported

let audioCtx: AudioContext | null = null;
let currentNodes: AudioNode[] = [];
let masterGain: GainNode | null = null;

const VOLUME_KEY = 'wt_volume';
const DEFAULT_VOLUME = 0.7;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = getVolume();
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

export function getVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  const stored = localStorage.getItem(VOLUME_KEY);
  if (stored === null) return DEFAULT_VOLUME;
  const v = parseFloat(stored);
  return isNaN(v) ? DEFAULT_VOLUME : Math.max(0, Math.min(1, v));
}

export function setVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOLUME_KEY, String(clamped));
  }
  if (masterGain) {
    masterGain.gain.setTargetAtTime(clamped, masterGain.context.currentTime, 0.05);
  }
}

export function stopAtmosphere(): void {
  currentNodes.forEach(n => {
    try {
      n.disconnect();
    } catch {}
  });
  currentNodes = [];
}

export function isAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('wt_audio') !== 'off';
}

export function setAudioEnabled(enabled: boolean): void {
  localStorage.setItem('wt_audio', enabled ? 'on' : 'off');
  if (!enabled) stopAtmosphere();
}

export function playAtmosphere(routeType: string | null, scene: string): void {
  stopAtmosphere();

  if (!isAudioEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  const atmosphereType = getAtmosphereType(routeType, scene);
  if (!atmosphereType) return;

  try {
    createAtmosphere(ctx, atmosphereType);
  } catch {}
}

type AtmosphereType =
  | 'wagon_trail'
  | 'fort_gates'
  | 'wilderness'
  | 'campfire'
  | 'performance_venue'
  | 'tension';

function getAtmosphereType(routeType: string | null, scene: string): AtmosphereType | null {
  if (scene === 'SUMMARY') return 'campfire';
  if (scene === 'ENTERTAINMENT_CIRCUIT') return 'performance_venue';
  if (scene === 'GATEKEEPER') return routeType === 'fort_route' ? 'fort_gates' : 'tension';
  if (scene === 'CONFLICT') return 'tension';
  if (scene === 'COACHING') return 'campfire';
  if (
    scene === 'PLANNING' ||
    scene === 'WAGON_OPENER' ||
    scene === 'CHARACTER_INTRODUCTIONS'
  ) {
    if (routeType === 'wilderness_route') return 'wilderness';
    return 'wagon_trail';
  }
  return 'wagon_trail';
}

function createAtmosphere(ctx: AudioContext, type: AtmosphereType): void {
  const out = getMasterGain(ctx);
  switch (type) {
    case 'wagon_trail':      return createWagonTrail(ctx, out);
    case 'wilderness':       return createWilderness(ctx, out);
    case 'fort_gates':       return createFortGates(ctx, out);
    case 'campfire':         return createCampfire(ctx, out);
    case 'performance_venue': return createPerformanceVenue(ctx, out);
    case 'tension':          return createTension(ctx, out);
  }
}

// --- Noise buffer helper ---

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// --- Atmosphere creators ---

function createWagonTrail(ctx: AudioContext, out: AudioNode): void {
  try {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 2);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = ctx.createGain();
    gain.gain.value = 0.04;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    source.start();

    currentNodes.push(source, filter, gain);
  } catch {}
}

function createWilderness(ctx: AudioContext, out: AudioNode): void {
  try {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 2);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.03;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    source.start();

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.01;

    osc.connect(oscGain);
    oscGain.connect(out);
    osc.start();

    currentNodes.push(source, filter, gain, osc, oscGain);
  } catch {}
}

function createFortGates(ctx: AudioContext, out: AudioNode): void {
  try {
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 80;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.02;

    drone.connect(droneGain);
    droneGain.connect(out);
    drone.start();

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, 2);
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.015;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);
    noiseSource.start();

    currentNodes.push(drone, droneGain, noiseSource, noiseFilter, noiseGain);
  } catch {}
}

function createCampfire(ctx: AudioContext, out: AudioNode): void {
  try {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 2);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.025;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    source.start();

    currentNodes.push(source, filter, gain);
  } catch {}
}

function createPerformanceVenue(ctx: AudioContext, out: AudioNode): void {
  try {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 220;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 330;

    const gain1 = ctx.createGain();
    gain1.gain.value = 0.015;

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.015;

    // Subtle chorus via delay with feedback
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.008;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.1;

    const merger = ctx.createGain();
    merger.gain.value = 1;

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(merger);
    gain2.connect(merger);
    merger.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    merger.connect(out);
    delay.connect(out);

    osc1.start();
    osc2.start();

    currentNodes.push(osc1, osc2, gain1, gain2, delay, feedback, merger);
  } catch {}
}

function createTension(ctx: AudioContext, out: AudioNode): void {
  try {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;

    const gain = ctx.createGain();
    gain.gain.value = 0.018;

    // Slow LFO to modulate gain for pulse effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.006;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(out);

    osc.start();
    lfo.start();

    currentNodes.push(osc, gain, lfo, lfoGain);
  } catch {}
}
