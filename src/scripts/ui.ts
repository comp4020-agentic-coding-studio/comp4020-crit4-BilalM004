import type { HandpanNoteDef } from "./audio/notes";

interface HandpanKeyLayout {
  key: string;
  xPercent: number;
  yPercent: number;
  sizePercent: number;
}

const CENTER_SIZE_PERCENT = 30;
const RING_SIZE_PERCENT = 26;
const RING_RADIUS_PERCENT = 33;

/** First key is the centre "ding"; the rest ring around it clockwise from
 * the top, same layout a real handpan's tone fields sit in. */
function computeHandpanLayout(keys: readonly string[]): HandpanKeyLayout[] {
  const [center, ...ring] = keys;
  const layout: HandpanKeyLayout[] = [
    { key: center, xPercent: 50, yPercent: 50, sizePercent: CENTER_SIZE_PERCENT },
  ];
  ring.forEach((key, index) => {
    const angle = ((-90 + (360 / ring.length) * index) * Math.PI) / 180;
    layout.push({
      key,
      xPercent: 50 + RING_RADIUS_PERCENT * Math.cos(angle),
      yPercent: 50 + RING_RADIUS_PERCENT * Math.sin(angle),
      sizePercent: RING_SIZE_PERCENT,
    });
  });
  return layout;
}

/** Drawn, not photographed -- an illustrated dished shell, so there's no
 * image licence to track down or credit. Purely decorative: the buttons
 * carry all the interaction and labelling. */
const HANDPAN_SHELL_SVG = `
  <svg class="handpan-shell" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="handpan-shell-fill" cx="42%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#5b6472" />
        <stop offset="55%" stop-color="#333a45" />
        <stop offset="100%" stop-color="#181c22" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#handpan-shell-fill)" stroke="#0d0f13" stroke-width="1" />
  </svg>
`;

/** Renders the note keyboard as a handpan: real, labelled <button>s in the
 * instrument's usual ring-around-a-centre-"ding" layout, over a drawn shell.
 * Each key shows both the note it sounds and the QWERTY letter it's mapped
 * to; the label-toggle button (wired in main.ts) flips which one reads as
 * primary via the container's "show-letters" class -- the parens around
 * whichever label is secondary come from CSS, not markup, so nothing here
 * needs to change when that toggles. Keyboard operability and
 * screen-reader affordance still come from using <button> instead of a
 * styled <div>. */
export function renderHandpan(container: HTMLElement, notes: readonly HandpanNoteDef[]): void {
  container.innerHTML = HANDPAN_SHELL_SVG;
  const layout = computeHandpanLayout(notes.map((def) => def.key));
  const noteByKey = new Map(notes.map((def) => [def.key, def.note]));

  for (const { key, xPercent, yPercent, sizePercent } of layout) {
    const noteName = noteByKey.get(key) ?? "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key note-key";
    button.dataset.key = key;
    button.setAttribute("aria-label", `Play note ${noteName} (key ${key.toUpperCase()})`);
    button.innerHTML = `<span class="note-name">${noteName}</span><span class="note-key-letter">${key.toUpperCase()}</span>`;
    button.style.left = `${xPercent}%`;
    button.style.top = `${yPercent}%`;
    button.style.width = `${sizePercent}%`;
    button.style.height = `${sizePercent}%`;
    container.appendChild(button);
  }
}

export interface TuneDisplay {
  title: string;
  notes: readonly string[];
}

export interface TuneControls {
  playPauseButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
}

/** Drawn as plain shapes rather than an icon font, so they render crisply
 * at any size and pick up the button's own text colour via currentColor. */
const PLAY_ICON_SVG = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.3v11.4a.6.6 0 0 0 .92.5l9-5.7a.6.6 0 0 0 0-1l-9-5.7a.6.6 0 0 0-.92.5z" fill="currentColor"/></svg>`;
const PAUSE_ICON_SVG = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3.5" y="2.5" width="3" height="11" rx="0.5" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="0.5" fill="currentColor"/></svg>`;
const STOP_ICON_SVG = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor"/></svg>`;

/** Swaps the play/pause button's icon and label to match playback state.
 * `resuming` distinguishes a fresh play from picking a paused tune back up,
 * since both show the same play icon but read differently to a screen
 * reader. */
export function setPlayPauseIcon(button: HTMLButtonElement, tune: TuneDisplay, state: "playing" | "paused" | "stopped"): void {
  if (state === "playing") {
    button.innerHTML = PAUSE_ICON_SVG;
    button.setAttribute("aria-label", `Pause ${tune.title}`);
  } else {
    button.innerHTML = PLAY_ICON_SVG;
    button.setAttribute("aria-label", `${state === "paused" ? "Resume" : "Play"} ${tune.title}`);
  }
}

/** Renders a single tune -- its title and a note sequence for reference
 * only (so the player has to find the notes on the handpan themselves),
 * already formatted by the caller as either note names or keyboard letters
 * per the label-mode toggle -- plus play/pause and stop buttons that call
 * back into `onPlayPause`/`onStop`. One tune fills the whole page; turning
 * the page calls this again with the next tune. Returns the rendered
 * buttons so the caller can keep updating their icon/label/disabled state
 * as playback progresses, without re-rendering the whole page.
 *
 * `tune` is kept separate from `notesText` (rather than formatting
 * `tune.notes` here) because the same `tune` is handed back to
 * `onPlayPause`/`onStop`, and playback needs the real note names to look
 * up frequencies regardless of what's currently displayed. */
export function renderBookPage(
  pageEl: HTMLElement,
  tune: TuneDisplay,
  notesText: string,
  onPlayPause: (tune: TuneDisplay, button: HTMLButtonElement) => void,
  onStop: (tune: TuneDisplay, button: HTMLButtonElement) => void,
): TuneControls {
  pageEl.innerHTML = "";

  const entry = document.createElement("article");
  entry.className = "tune";

  const heading = document.createElement("h3");
  heading.textContent = tune.title;

  const sequence = document.createElement("p");
  sequence.className = "tune-notes";
  sequence.textContent = notesText;

  const controls = document.createElement("div");
  controls.className = "tune-controls";

  const playPauseButton = document.createElement("button");
  playPauseButton.type = "button";
  playPauseButton.className = "tune-play";
  playPauseButton.addEventListener("click", () => onPlayPause(tune, playPauseButton));

  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "tune-stop";
  stopButton.innerHTML = STOP_ICON_SVG;
  stopButton.setAttribute("aria-label", `Stop ${tune.title}`);
  stopButton.disabled = true;
  stopButton.addEventListener("click", () => onStop(tune, stopButton));

  setPlayPauseIcon(playPauseButton, tune, "stopped");
  controls.append(playPauseButton, stopButton);
  entry.append(heading, sequence, controls);
  pageEl.appendChild(entry);
  return { playPauseButton, stopButton };
}

/** Renders one page of the notepad: the recorded notes so far (already
 * formatted by the caller per the label-mode toggle, same as the book's
 * note-sequence line), or a placeholder explaining what to do next when
 * there's nothing to show yet -- which differs depending on whether
 * recording is currently on. */
export function renderNotepadPage(pageEl: HTMLElement, notesText: string, hasNotes: boolean, recordingEnabled: boolean): void {
  pageEl.innerHTML = "";
  const p = document.createElement("p");
  if (hasNotes) {
    p.className = "tune-notes notepad-notes";
    p.textContent = notesText;
  } else {
    p.className = "notepad-empty";
    p.textContent = recordingEnabled
      ? "Play a note to start recording."
      : "Turn on recording to start capturing what you play.";
  }
  pageEl.appendChild(p);
}

export function setKeyHeld(root: ParentNode, key: string, held: boolean): void {
  const button = root.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
  button?.classList.toggle("held", held);
}
