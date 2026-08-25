export interface Tune {
  title: string;
  notes: readonly string[];
}

/** Seed set -- simple, public-domain/traditional melodies picked because
 * every note they need (C4 D4 E4 F4 G4) falls inside the handpan's Kurd
 * scale (see audio/notes.ts). Meant to be replaced/expanded with whatever
 * tunes get picked next, not a finished song list. */
export const TUNES: readonly Tune[] = [
  {
    title: "Twinkle Twinkle Little Star",
    notes: [
      "C4", "C4", "G4", "G4", "A4", "A4", "G4",
      "F4", "F4", "E4", "E4", "D4", "D4", "C4",
      "G4", "G4", "F4", "F4", "E4", "E4", "D4",
      "G4", "G4", "F4", "F4", "E4", "E4", "D4",
      "C4", "C4", "G4", "G4", "A4", "A4", "G4",
      "F4", "F4", "E4", "E4", "D4", "D4", "C4",
    ],
  },
  {
    title: "Mary Had a Little Lamb",
    notes: [
      "E4", "D4", "C4", "D4", "E4", "E4", "E4",
      "D4", "D4", "D4",
      "E4", "G4", "G4",
      "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
      "D4", "D4", "E4", "D4", "C4",
    ],
  },
  {
    title: "Ode to Joy",
    notes: [
      "E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "E4", "D4", "D4",
      "E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "D4", "C4", "C4",
    ],
  },
];
