// High-fidelity audio synthesizer for wake word chime, security siren, and speech feedback
class SoundEffectsManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Soft unobtrusive chime when wake word is recognized
  playWakeUp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.06);
      gain2.gain.setValueAtTime(0.001, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn("Audio chime play error:", e);
    }
  }

  // Intruder Alert Siren when an unauthorized person touches/faces the phone
  playIntruderAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Dual alternating oscillating warble siren
      for (let i = 0; i < 3; i++) {
        const offset = now + i * 0.4;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, offset);
        osc.frequency.linearRampToValueAtTime(1300, offset + 0.2);
        osc.frequency.linearRampToValueAtTime(750, offset + 0.4);

        gain.gain.setValueAtTime(0.001, offset);
        gain.gain.exponentialRampToValueAtTime(0.25, offset + 0.05);
        gain.gain.setValueAtTime(0.25, offset + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, offset + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(offset);
        osc.stop(offset + 0.4);
      }
    } catch (e) {
      console.warn("Intruder siren error:", e);
    }
  }

  // Success chime for Face Verification
  playSuccess() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  // Shutter click for photo capture
  playShutter() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffectsManager();
