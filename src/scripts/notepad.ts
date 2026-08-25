import { formatNoteNames, onLabelModeChange } from "./label-mode";
import {
  clearRecording,
  getPages,
  isRecordingEnabled,
  onNoteRecorded,
  onRecordingToggle,
  setRecordingEnabled,
} from "./note-recorder";
import { renderNotepadPage } from "./ui";

export interface NotepadElements {
  toggle: HTMLButtonElement;
  page: HTMLElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  indicator: HTMLElement;
  clear: HTMLButtonElement;
}

/** Wires the "record notes played" toggle and the notepad it fills: every
 * note the player triggers on the instrument (recorded in note-recorder.ts,
 * not here) lands on the notepad's last page, and the view here always
 * jumps to follow it -- prev/next still let you look back at earlier pages
 * without losing that thread. Mirrors the music book's page-turning shape,
 * but there's no playback to pause/stop on navigation. The panel itself is
 * always visible (its toggle lives inside it), so there's no show/hide
 * state to track here -- just what the current page renders. */
export function wireNotepad(els: NotepadElements): void {
  let viewIndex = 0;

  function hasAnyNotes(): boolean {
    return getPages().some((page) => page.length > 0);
  }

  function render(): void {
    const pages = getPages();
    const page = pages[viewIndex] ?? [];
    renderNotepadPage(els.page, formatNoteNames(page), page.length > 0, isRecordingEnabled());
    els.indicator.textContent = `${viewIndex + 1} / ${pages.length}`;
    els.prev.disabled = viewIndex === 0;
    els.next.disabled = viewIndex === pages.length - 1;
    els.clear.disabled = !hasAnyNotes();
  }

  function updateToggle(enabled: boolean): void {
    els.toggle.textContent = enabled ? "Stop recording" : "Record notes played";
    els.toggle.setAttribute("aria-pressed", String(enabled));
  }

  els.toggle.addEventListener("click", () => {
    setRecordingEnabled(!isRecordingEnabled());
  });

  els.prev.addEventListener("click", () => {
    if (viewIndex === 0) return;
    viewIndex -= 1;
    render();
  });

  els.next.addEventListener("click", () => {
    if (viewIndex >= getPages().length - 1) return;
    viewIndex += 1;
    render();
  });

  els.clear.addEventListener("click", () => {
    clearRecording();
    viewIndex = 0;
  });

  onRecordingToggle((enabled) => {
    updateToggle(enabled);
    render();
  });

  onNoteRecorded((pageIndex) => {
    viewIndex = pageIndex; // always follow the newest note
    render();
  });

  onLabelModeChange(() => render());

  updateToggle(isRecordingEnabled());
  render();
}
