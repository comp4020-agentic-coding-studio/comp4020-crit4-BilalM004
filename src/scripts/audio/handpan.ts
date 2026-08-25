import { Voice } from "./voice";

interface Partial {
  ratio: number;
  gain: number;
}

/** A struck handpan tone is mostly its fundamental plus two characteristic
 * overtones (roughly an octave, and an octave-and-a-fifth, above it), all
 * decaying together. Unlike a bowed/blown note it isn't sustained by
 * continued energy, so a longer hold doesn't brighten it -- it just lets
 * the overtones bloom in a little further before the strike decays. */
const PARTIALS: Partial[] = [
  { ratio: 1, gain: 1 },
  { ratio: 2, gain: 0.35 },
  { ratio: 3, gain: 0.15 },
];

const ATTACK_SECONDS = 0.006;
const RELEASE_SECONDS = 1.8;
const BASE_CUTOFF_HZ = 700;
const BRIGHT_CUTOFF_HZ = 2200;
const HOLD_RAMP_TIME_CONSTANT = 2.5;
const OVERALL_GAIN = 0.22;

/** One struck note: several detuned-ratio Voice partials sharing a strike
 * time and release. */
export class HandpanNote {
  private readonly voices: Voice[];

  constructor(ctx: AudioContext, freq: number, startTime: number) {
    this.voices = PARTIALS.map(({ ratio, gain }) => {
      const voice = new Voice(ctx, {
        type: "sine",
        attackSeconds: ATTACK_SECONDS,
        releaseSeconds: RELEASE_SECONDS,
        peakGain: OVERALL_GAIN * gain,
        baseCutoffHz: BASE_CUTOFF_HZ,
        brightCutoffHz: BRIGHT_CUTOFF_HZ,
        holdRampTimeConstant: HOLD_RAMP_TIME_CONSTANT,
      });
      voice.noteOn(freq * ratio, startTime);
      return voice;
    });
  }

  noteOff(time: number): void {
    for (const voice of this.voices) {
      voice.noteOff(time);
    }
  }
}
