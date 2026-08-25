export interface HandpanNoteDef {
  key: string;
  note: string;
  freq: number;
}

function freqFromA4(semitones: number): number {
  return 440 * Math.pow(2, semitones / 12);
}

/** The Kurd (D minor) scale -- the most common handpan tuning: a low
 * central "ding" plus a ring of tone fields ascending around it. Real
 * handpans are tuned to a scale like this, not a chromatic run, and the
 * ding isn't necessarily the lowest-sounding note by accident -- it's a
 * deliberately low drone the ring sits above. */
export const HANDPAN_NOTES: readonly HandpanNoteDef[] = [
  { key: "a", note: "D3", freq: freqFromA4(-19) }, // ding
  { key: "s", note: "A3", freq: freqFromA4(-12) },
  { key: "d", note: "Bb3", freq: freqFromA4(-11) },
  { key: "f", note: "C4", freq: freqFromA4(-9) },
  { key: "g", note: "D4", freq: freqFromA4(-7) },
  { key: "h", note: "E4", freq: freqFromA4(-5) },
  { key: "j", note: "F4", freq: freqFromA4(-4) },
  { key: "k", note: "G4", freq: freqFromA4(-2) },
  { key: "l", note: "A4", freq: freqFromA4(0) },
  { key: ";", note: "Bb4", freq: freqFromA4(1) },
];

export const NOTE_BY_KEY: ReadonlyMap<string, HandpanNoteDef> = new Map(
  HANDPAN_NOTES.map((def) => [def.key, def]),
);

export const KEY_BY_NOTE: ReadonlyMap<string, string> = new Map(
  HANDPAN_NOTES.map((def) => [def.note, def.key]),
);
