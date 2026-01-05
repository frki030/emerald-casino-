
class SoundManager {
  private ctx: AudioContext | null = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  deal() {
    this.playTone(600, 'sine', 0.1, 0.05);
  }

  hit() {
    this.playTone(800, 'sine', 0.1, 0.05);
  }

  stand() {
    this.playTone(300, 'triangle', 0.2, 0.05);
  }

  win() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.3, 0.02), i * 100);
    });
  }

  lose() {
    const ctx = this.getCtx();
    this.playTone(200, 'sawtooth', 0.5, 0.03);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.03), 200);
  }

  tick() {
    this.playTone(1000, 'sine', 0.02, 0.01);
  }
}

export const sounds = new SoundManager();
