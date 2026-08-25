export interface VoiceOptions {
  type?: OscillatorType;
  attackSeconds?: number;
  releaseSeconds?: number;
  peakGain?: number;
  baseCutoffHz?: number;
  brightCutoffHz?: number;
  holdRampTimeConstant?: number;
  detuneCents?: number;
}

const QUICK_STOP_SECONDS = 0.05;

const DEFAULT_OPTIONS: Required<Omit<VoiceOptions, "detuneCents">> = {
  type: "sawtooth",
  attackSeconds: 0.015,
  releaseSeconds: 0.15,
  peakGain: 0.25,
  baseCutoffHz: 500,
  brightCutoffHz: 3200,
  holdRampTimeConstant: 1.4,
};

/**
 * One oscillator -> filter -> gain voice. Single-use: noteOn starts the
 * oscillator, noteOff schedules its stop. Create a new Voice per note rather
 * than reusing one, since a Web Audio oscillator can only ever be started once.
 *
 * Options default to the normal-keyboard envelope; tune sequences override
 * them (brighter/shorter for a pluck, slower attack for a chord swell) while
 * sharing this same primitive.
 */
export class Voice {
  private readonly osc: OscillatorNode;
  private readonly filter: BiquadFilterNode;
  private readonly gain: GainNode;
  private readonly options: Required<Omit<VoiceOptions, "detuneCents">>;

  constructor(ctx: AudioContext, options: VoiceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.osc = ctx.createOscillator();
    this.osc.type = this.options.type;
    if (options.detuneCents) {
      this.osc.detune.value = options.detuneCents;
    }

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.options.baseCutoffHz;

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
    const { attackSeconds, peakGain, baseCutoffHz, brightCutoffHz, holdRampTimeConstant } = this.options;

    this.osc.frequency.setValueAtTime(freq, startTime);

    this.gain.gain.setValueAtTime(0, startTime);
    this.gain.gain.linearRampToValueAtTime(peakGain, startTime + attackSeconds);

    this.filter.frequency.setValueAtTime(baseCutoffHz, startTime);
    this.filter.frequency.setTargetAtTime(brightCutoffHz, startTime, holdRampTimeConstant);

    this.osc.start(startTime);
  }

  noteOff(time: number): void {
    const { releaseSeconds } = this.options;

    this.gain.gain.cancelScheduledValues(time);
    this.gain.gain.setValueAtTime(this.gain.gain.value, time);
    this.gain.gain.linearRampToValueAtTime(0, time + releaseSeconds);

    this.filter.frequency.cancelScheduledValues(time);

    this.osc.stop(time + releaseSeconds + 0.05);
  }

  /** Cuts the note short, e.g. because playback was stopped mid-tune. A
   * quick fade (rather than noteOff's full release) avoids a click; if the
   * note hasn't started yet (its noteOn was scheduled for later), this
   * cancels it before it ever sounds. */
  stopNow(time: number): void {
    this.gain.gain.cancelScheduledValues(time);
    this.gain.gain.setValueAtTime(this.gain.gain.value, time);
    this.gain.gain.linearRampToValueAtTime(0, time + QUICK_STOP_SECONDS);

    this.filter.frequency.cancelScheduledValues(time);

    this.osc.stop(time + QUICK_STOP_SECONDS + 0.01);
  }
}
