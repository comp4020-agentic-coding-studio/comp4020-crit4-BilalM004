import { Voice } from "./voice";

export type TuneId = "alarm" | "startup" | "notification";

export const TUNE_LABELS: Record<TuneId, string> = {
  alarm: "Alarm",
  startup: "Startup",
  notification: "Ping",
};

const ALARM_HIGH_HZ = 1600;
const ALARM_LOW_HZ = 1300;
const ALARM_NOTE_SECONDS = 0.09;
const ALARM_GAP_SECONDS = 0.05;
const ALARM_REPEATS = 3;

const STARTUP_CHORD_HZ = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5
const STARTUP_DETUNE_CENTS = [-5, -2, 2, 5];
const STARTUP_HOLD_SECONDS = 1.8;

const BELL_CARRIER_HZ = 880;
const BELL_MODULATOR_HZ = 1480;
const BELL_MODULATION_DEPTH_HZ = 600;
const BELL_DECAY_SECONDS = 0.8;

function playPluck(ctx: AudioContext, freq: number, time: number): void {
  const voice = new Voice(ctx, {
    type: "square",
    attackSeconds: 0.004,
    releaseSeconds: 0.05,
    peakGain: 0.3,
    baseCutoffHz: 4000,
    brightCutoffHz: 4000,
  });
  voice.noteOn(freq, time);
  voice.noteOff(time + ALARM_NOTE_SECONDS);
}

function playAlarm(ctx: AudioContext, startTime: number): void {
  const step = ALARM_NOTE_SECONDS + ALARM_GAP_SECONDS;
  for (let repeat = 0; repeat < ALARM_REPEATS; repeat++) {
    const pairStart = startTime + repeat * step * 2;
    playPluck(ctx, ALARM_HIGH_HZ, pairStart);
    playPluck(ctx, ALARM_LOW_HZ, pairStart + step);
  }
}

function playStartup(ctx: AudioContext, startTime: number): void {
  STARTUP_CHORD_HZ.forEach((freq, index) => {
    const voice = new Voice(ctx, {
      type: "sine",
      attackSeconds: 1.1,
      releaseSeconds: 1.0,
      peakGain: 0.16,
      baseCutoffHz: 800,
      brightCutoffHz: 2600,
      holdRampTimeConstant: 1.0,
      detuneCents: STARTUP_DETUNE_CENTS[index],
    });
    voice.noteOn(freq, startTime);
    voice.noteOff(startTime + STARTUP_HOLD_SECONDS);
  });
}

/** FM bell: a sine modulator patched into the carrier's frequency, both
 * decaying together. This is a different graph shape than Voice's static
 * filter chain, so it's built directly rather than through Voice. */
function playNotification(ctx: AudioContext, startTime: number): void {
  const stopTime = startTime + BELL_DECAY_SECONDS + 0.05;

  const modulator = ctx.createOscillator();
  modulator.type = "sine";
  modulator.frequency.value = BELL_MODULATOR_HZ;

  const modulationGain = ctx.createGain();
  modulationGain.gain.setValueAtTime(BELL_MODULATION_DEPTH_HZ, startTime);
  modulationGain.gain.exponentialRampToValueAtTime(1, startTime + BELL_DECAY_SECONDS);

  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = BELL_CARRIER_HZ;

  const outputGain = ctx.createGain();
  outputGain.gain.setValueAtTime(0.3, startTime);
  outputGain.gain.exponentialRampToValueAtTime(0.001, startTime + BELL_DECAY_SECONDS);
  outputGain.gain.setValueAtTime(0, stopTime);

  modulator.connect(modulationGain);
  modulationGain.connect(carrier.frequency);
  carrier.connect(outputGain);
  outputGain.connect(ctx.destination);

  modulator.start(startTime);
  carrier.start(startTime);
  modulator.stop(stopTime);
  carrier.stop(stopTime);

  carrier.onended = () => {
    modulator.disconnect();
    modulationGain.disconnect();
    carrier.disconnect();
    outputGain.disconnect();
  };
}

export function playTune(id: TuneId, ctx: AudioContext, startTime: number = ctx.currentTime): void {
  switch (id) {
    case "alarm":
      playAlarm(ctx, startTime);
      break;
    case "startup":
      playStartup(ctx, startTime);
      break;
    case "notification":
      playNotification(ctx, startTime);
      break;
  }
}
