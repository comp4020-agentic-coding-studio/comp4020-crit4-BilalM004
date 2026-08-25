const ATTACK_SECONDS = 0.015;
const RELEASE_SECONDS = 0.15;
const PEAK_GAIN = 0.25;
const BASE_CUTOFF_HZ = 500;
const BRIGHT_CUTOFF_HZ = 3200;
const HOLD_RAMP_TIME_CONSTANT = 1.4;

/**
 * One oscillator -> filter -> gain voice. Single-use: noteOn starts the
 * oscillator, noteOff schedules its stop. Create a new Voice per note rather
 * than reusing one, since a Web Audio oscillator can only ever be started once.
 */
export class Voice {
  private readonly osc: OscillatorNode;
  private readonly filter: BiquadFilterNode;
  private readonly gain: GainNode;

  constructor(ctx: AudioContext, type: OscillatorType = "sawtooth") {
    this.osc = ctx.createOscillator();
    this.osc.type = type;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = BASE_CUTOFF_HZ;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(ctx.destination);

    this.osc.onended = () => {
      this.osc.disconnect();
      this.filter.disconnect();
      this.gain.disconnect();
    };
  }

  /** Start the note. The filter cutoff then drifts open the longer the note
   * stays held (see noteOff) -- this is the hold-duration expressiveness. */
  noteOn(freq: number, startTime: number): void {
    this.osc.frequency.setValueAtTime(freq, startTime);

    this.gain.gain.setValueAtTime(0, startTime);
    this.gain.gain.linearRampToValueAtTime(PEAK_GAIN, startTime + ATTACK_SECONDS);

    this.filter.frequency.setValueAtTime(BASE_CUTOFF_HZ, startTime);
    this.filter.frequency.setTargetAtTime(BRIGHT_CUTOFF_HZ, startTime, HOLD_RAMP_TIME_CONSTANT);

    this.osc.start(startTime);
  }

  noteOff(time: number): void {
    this.gain.gain.cancelScheduledValues(time);
    this.gain.gain.setValueAtTime(this.gain.gain.value, time);
    this.gain.gain.linearRampToValueAtTime(0, time + RELEASE_SECONDS);

    this.filter.frequency.cancelScheduledValues(time);

    this.osc.stop(time + RELEASE_SECONDS + 0.05);
  }
}
