import { KEY_BY_NOTE } from "./audio/notes";

/** Whether notes are shown as note names (e.g. "C4") or keyboard letters
 * (e.g. "F") -- shared between the handpan keys and the book's note-sequence
 * text so one toggle button (wired in main.ts) drives both. */
export type LabelMode = "notes" | "keys";

let mode: LabelMode = "notes";
const listeners = new Set<(mode: LabelMode) => void>();

export function getLabelMode(): LabelMode {
  return mode;
}

export function setLabelMode(next: LabelMode): void {
  if (next === mode) return;
  mode = next;
  for (const listener of listeners) listener(mode);
}

export function onLabelModeChange(listener: (mode: LabelMode) => void): void {
  listeners.add(listener);
}

/** Renders a list of note names as either the note names themselves or the
 * keyboard letters that play them, depending on the current label mode --
 * shared by the book's tune display and the notepad's recorded notes so both
 * read consistently. */
export function formatNoteNames(notes: readonly string[]): string {
  if (mode === "notes") return notes.join(" · ");
  return notes.map((noteName) => (KEY_BY_NOTE.get(noteName) ?? noteName).toUpperCase()).join(" · ");
}
