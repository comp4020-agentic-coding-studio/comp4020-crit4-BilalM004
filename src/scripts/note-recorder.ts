/** Shared state for the "record notes played" toggle -- same
 * get/set/onChange shape as label-mode.ts, kept separate from the notepad's
 * DOM wiring so keyboard.ts (where notes are actually triggered) can record
 * them without depending on the notepad UI. */

const NOTES_PER_PAGE = 20;

let enabled = false;
let pages: string[][] = [[]];
const toggleListeners = new Set<(enabled: boolean) => void>();
const noteListeners = new Set<(pageIndex: number) => void>();

export function isRecordingEnabled(): boolean {
  return enabled;
}

export function setRecordingEnabled(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  for (const listener of toggleListeners) listener(enabled);
}

export function onRecordingToggle(listener: (enabled: boolean) => void): void {
  toggleListeners.add(listener);
}

/** Appends a played note to the last page, if recording is on -- rolling
 * onto a fresh page first once the last page is full. No-ops otherwise, so
 * callers (keyboard.ts) don't need to check `isRecordingEnabled()`
 * themselves. */
export function recordNote(noteName: string): void {
  if (!enabled) return;
  if (pages[pages.length - 1].length >= NOTES_PER_PAGE) pages.push([]);
  pages[pages.length - 1].push(noteName);
  const pageIndex = pages.length - 1;
  for (const listener of noteListeners) listener(pageIndex);
}

export function onNoteRecorded(listener: (pageIndex: number) => void): void {
  noteListeners.add(listener);
}

export function getPages(): readonly (readonly string[])[] {
  return pages;
}

export function clearRecording(): void {
  pages = [[]];
  for (const listener of toggleListeners) listener(enabled);
  for (const listener of noteListeners) listener(0);
}
