import { getAudioContext, resumeOnFirstGesture } from "./audio/context";
import { HandpanNote } from "./audio/handpan";
import { HANDPAN_NOTES, NOTE_BY_KEY } from "./audio/notes";
import { recordNote } from "./note-recorder";
import { renderHandpan, setKeyHeld } from "./ui";

/** Renders the handpan into `keyboardEl`, then wires pointer and physical-key
 * input to the same trigger functions. */
export function wireKeyboard(root: HTMLElement, keyboardEl: HTMLElement): void {
  renderHandpan(keyboardEl, HANDPAN_NOTES);

  const activeNotes = new Map<string, HandpanNote>();

  function noteOn(key: string): void {
    if (activeNotes.has(key)) return; // already sounding -- ignore OS key-repeat
    const def = NOTE_BY_KEY.get(key);
    if (!def) return;

    const ctx = getAudioContext();
    resumeOnFirstGesture(ctx);

    activeNotes.set(key, new HandpanNote(ctx, def.freq, ctx.currentTime));
    setKeyHeld(root, key, true);
    recordNote(def.note);
  }

  function noteOff(key: string): void {
    const note = activeNotes.get(key);
    if (!note) return;

    note.noteOff(getAudioContext().currentTime);
    activeNotes.delete(key);
    setKeyHeld(root, key, false);
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    noteOn(event.key.toLowerCase());
  });
  window.addEventListener("keyup", (event) => {
    noteOff(event.key.toLowerCase());
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-key]")) {
    const key = button.dataset.key;
    if (!key) continue;
    button.addEventListener("pointerdown", () => noteOn(key));
    button.addEventListener("pointerup", () => noteOff(key));
    button.addEventListener("pointerleave", () => noteOff(key));
    button.addEventListener("pointercancel", () => noteOff(key));
  }
}
