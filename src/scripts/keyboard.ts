import { getAudioContext, resumeOnFirstGesture } from "./audio/context";
import { HandpanNote } from "./audio/handpan";
import { playTune, TUNE_LABELS, type TuneId } from "./audio/tunes";
import { renderHandpan, renderTuneKeys, setKeyHeld, type TuneKeyInfo } from "./ui";

/** QWERTY home row, white-key style -- the common web-synth convention. */
export const NOTE_KEY_ORDER = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"] as const;

/** Row below, one dedicated key per tune. */
const TUNE_KEY_MAP: Record<string, TuneId> = {
  z: "alarm",
  x: "startup",
  c: "notification",
};

function noteFrequency(semitonesFromA4: number): number {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// C4 through A4, one semitone per key.
const NOTE_FREQUENCIES: ReadonlyMap<string, number> = new Map(
  NOTE_KEY_ORDER.map((key, index) => [key, noteFrequency(index - 9)]),
);

/** Renders the note keyboard into `keyboardEl` and the tune keys into
 * `tuneKeysEl`, then wires pointer and physical-key input -- for both --
 * to the same trigger functions. */
export function wireKeyboard(root: HTMLElement, keyboardEl: HTMLElement, tuneKeysEl: HTMLElement): void {
  renderHandpan(keyboardEl, NOTE_KEY_ORDER);

  const tuneKeys: TuneKeyInfo[] = Object.entries(TUNE_KEY_MAP).map(([key, id]) => ({
    key,
    label: TUNE_LABELS[id],
  }));
  renderTuneKeys(tuneKeysEl, tuneKeys);

  const activeNotes = new Map<string, HandpanNote>();
  const activeTuneKeys = new Set<string>();

  function noteOn(key: string): void {
    if (activeNotes.has(key)) return; // already sounding -- ignore OS key-repeat
    const freq = NOTE_FREQUENCIES.get(key);
    if (freq === undefined) return;

    const ctx = getAudioContext();
    resumeOnFirstGesture(ctx);

    activeNotes.set(key, new HandpanNote(ctx, freq, ctx.currentTime));
    setKeyHeld(root, key, true);
  }

  function noteOff(key: string): void {
    const note = activeNotes.get(key);
    if (!note) return;

    note.noteOff(getAudioContext().currentTime);
    activeNotes.delete(key);
    setKeyHeld(root, key, false);
  }

  function tuneOn(key: string): void {
    if (activeTuneKeys.has(key)) return; // ignore OS key-repeat
    const tuneId = TUNE_KEY_MAP[key];
    if (!tuneId) return;

    const ctx = getAudioContext();
    resumeOnFirstGesture(ctx);

    playTune(tuneId, ctx);
    activeTuneKeys.add(key);
    setKeyHeld(root, key, true);
  }

  function tuneOff(key: string): void {
    if (!activeTuneKeys.has(key)) return;
    activeTuneKeys.delete(key);
    setKeyHeld(root, key, false);
  }

  function keyDown(key: string): void {
    if (NOTE_FREQUENCIES.has(key)) {
      noteOn(key);
    } else if (key in TUNE_KEY_MAP) {
      tuneOn(key);
    }
  }

  function keyUp(key: string): void {
    if (NOTE_FREQUENCIES.has(key)) {
      noteOff(key);
    } else if (key in TUNE_KEY_MAP) {
      tuneOff(key);
    }
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    keyDown(event.key.toLowerCase());
  });
  window.addEventListener("keyup", (event) => {
    keyUp(event.key.toLowerCase());
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-key]")) {
    const key = button.dataset.key;
    if (!key) continue;
    button.addEventListener("pointerdown", () => keyDown(key));
    button.addEventListener("pointerup", () => keyUp(key));
    button.addEventListener("pointerleave", () => keyUp(key));
    button.addEventListener("pointercancel", () => keyUp(key));
  }
}
