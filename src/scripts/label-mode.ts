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
