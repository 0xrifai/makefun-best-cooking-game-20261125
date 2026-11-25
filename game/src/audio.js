// Sizzle & Serve — tiny WebAudio bleeps. Oscillators only, no sound files,
// no network. The context is created on the first user gesture; every call
// is guarded so a browser without audio never breaks the game.

export function createAudio() {
  const audio = { ctx: null, muted: false };

  function ensure() {
    if (audio.muted) return null;
    try {
      if (!audio.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audio.ctx = new AC();
      }
      if (audio.ctx.state === 'suspended') void audio.ctx.resume();
      return audio.ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type, vol, when) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + (when || 0);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // audio is garnish; never let it break the game
    }
  }

  return {
    get muted() { return audio.muted; },
    toggleMute() { audio.muted = !audio.muted; return audio.muted; },
    unlock() { ensure(); },
    pickup() { tone(520, 0.09, 'triangle', 0.12); },
    place() { tone(340, 0.08, 'triangle', 0.1); },
    chop() { tone(190, 0.05, 'square', 0.07); tone(260, 0.05, 'square', 0.05, 0.05); },
    sizzle() { tone(1200, 0.12, 'sawtooth', 0.03); },
    ding() { tone(880, 0.16, 'sine', 0.14); tone(1318, 0.22, 'sine', 0.1, 0.09); },
    serve() {
      tone(523, 0.12, 'triangle', 0.13);
      tone(659, 0.12, 'triangle', 0.13, 0.1);
      tone(784, 0.2, 'triangle', 0.14, 0.2);
    },
    fail() { tone(160, 0.28, 'sawtooth', 0.09); tone(110, 0.32, 'sawtooth', 0.08, 0.12); },
    tick() { tone(980, 0.05, 'square', 0.05); },
    dayEnd() { tone(392, 0.15, 'triangle', 0.12); tone(523, 0.25, 'triangle', 0.12, 0.14); },
  };
}
