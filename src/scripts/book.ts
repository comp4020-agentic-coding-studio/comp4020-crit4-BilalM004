import { getAudioContext, resumeOnFirstGesture } from "./audio/context";
import { HandpanNote } from "./audio/handpan";
import { KEY_BY_NOTE, NOTE_BY_KEY } from "./audio/notes";
import { TUNES, type Tune } from "./book-data";
import { formatNoteNames, onLabelModeChange } from "./label-mode";
import { renderBookPage, setKeyHeld, setPlayPauseIcon, type TuneControls } from "./ui";

const NOTE_SECONDS = 0.4;
const GAP_SECONDS = 0.05;
const STEP_SECONDS = NOTE_SECONDS + GAP_SECONDS;

// Matches .book-cover's opacity transition duration in global.css.
const COVER_TRANSITION_MS = 220;

type PlaybackState = "stopped" | "playing" | "paused";

export interface BookElements {
  cover: HTMLButtonElement;
  pages: HTMLElement;
  page: HTMLElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  close: HTMLButtonElement;
  indicator: HTMLElement;
}

/** Wires the book cover, the page-turning controls (buttons and arrow
 * keys), and the play/pause and stop buttons on whichever tune is currently
 * showing -- which schedule the tune through the same `HandpanNote` voice
 * the player's own keys use, and flash each key as it sounds so a note name
 * and its keyboard letter read as the same thing.
 *
 * Only one tune can ever sound at a time. Pausing freezes it and remembers
 * how far in it got, so play resumes from there rather than the start; stop
 * forgets that position. Leaving the page early -- turning it or closing
 * the book -- stops (not pauses) whatever's playing, since a page turn is
 * treated as moving on from that tune rather than a pit stop. */
export function wireMusicBook(root: HTMLElement, els: BookElements): void {
  let pageIndex = 0;
  let isOpen = false;
  let playbackState: PlaybackState = "stopped";
  let pausedOffsetSeconds = 0;
  let runStartCtxTime = 0;
  let activeNotes: HandpanNote[] = [];
  let activeTimeouts: number[] = [];
  let controls: TuneControls | null = null;
  let coverHideTimeout: number | undefined;

  function renderPage(): void {
    const tune = TUNES[pageIndex];
    controls = renderBookPage(els.page, tune, formatNoteNames(tune.notes), handlePlayPauseClick, handleStopClick);
    els.indicator.textContent = `${pageIndex + 1} / ${TUNES.length}`;
    els.prev.disabled = pageIndex === 0;
    els.next.disabled = pageIndex === TUNES.length - 1;
  }

  function updateControls(): void {
    if (!controls) return;
    setPlayPauseIcon(controls.playPauseButton, TUNES[pageIndex], playbackState);
    controls.stopButton.disabled = playbackState === "stopped";
  }

  function goToPage(delta: number): void {
    const next = pageIndex + delta;
    if (next < 0 || next >= TUNES.length) return;
    stopTune();
    pageIndex = next;
    renderPage();
  }

  function open(): void {
    isOpen = true;
    renderPage();
    els.pages.hidden = false;
    els.cover.setAttribute("aria-expanded", "true");
    // Cover and pages share the same spot (see .music-book's grid stacking);
    // fading/tilting the cover away over the page rather than hiding it
    // outright is what makes this read as one book opening, not a swap.
    els.cover.classList.add("is-opening");
    coverHideTimeout = window.setTimeout(() => {
      els.cover.hidden = true;
      els.cover.classList.remove("is-opening");
    }, COVER_TRANSITION_MS);
    els.close.focus();
  }

  function close(): void {
    stopTune();
    clearTimeout(coverHideTimeout);
    isOpen = false;
    els.pages.hidden = true;
    els.cover.hidden = false;
    els.cover.classList.remove("is-opening"); // in case closing interrupted the opening fade
    els.cover.setAttribute("aria-expanded", "false");
    els.cover.focus();
  }

  function handlePlayPauseClick(tune: Tune): void {
    if (playbackState === "playing") pauseTune();
    else playFrom(tune, pausedOffsetSeconds);
    updateControls();
  }

  function handleStopClick(): void {
    stopTune();
    updateControls();
  }

  /** Schedules every note from `startOffsetSeconds` (tune-time, 0 at the
   * very start) onward against real time starting now -- a fresh play
   * starts at 0, a resume starts wherever pauseTune left off. */
  function playFrom(tune: Tune, startOffsetSeconds: number): void {
    if (playbackState === "playing") return;
    const ctx = getAudioContext();
    resumeOnFirstGesture(ctx);

    const baseCtxTime = ctx.currentTime + 0.05;
    runStartCtxTime = baseCtxTime - startOffsetSeconds;

    tune.notes.forEach((noteName, index) => {
      const offset = index * STEP_SECONDS;
      if (offset < startOffsetSeconds) return; // already sounded before the pause
      const key = KEY_BY_NOTE.get(noteName);
      const def = key ? NOTE_BY_KEY.get(key) : undefined;
      if (!key || !def) return;
      const time = runStartCtxTime + offset;
      const voice = new HandpanNote(ctx, def.freq, time);
      voice.noteOff(time + NOTE_SECONDS);
      activeNotes.push(voice);
      flashKey(root, key, time, NOTE_SECONDS, activeTimeouts);
    });

    const remainingSeconds = tune.notes.length * STEP_SECONDS - startOffsetSeconds;
    activeTimeouts.push(
      window.setTimeout(() => {
        playbackState = "stopped";
        pausedOffsetSeconds = 0;
        activeNotes = [];
        activeTimeouts = [];
        updateControls();
      }, remainingSeconds * 1000),
    );

    playbackState = "playing";
  }

  /** Freezes playback in place: cuts off whatever's sounding right now and
   * remembers the tune-time reached, so the next play resumes from there. */
  function pauseTune(): void {
    if (playbackState !== "playing") return;
    const now = getAudioContext().currentTime;
    pausedOffsetSeconds = Math.max(0, now - runStartCtxTime);
    cutOffActiveNotes(now);
    playbackState = "paused";
  }

  /** Cuts off whatever's currently sounding or scheduled, if anything, and
   * forgets any paused position. Does not re-render -- callers that need
   * the controls back to their resting state do that themselves. */
  function stopTune(): void {
    if (playbackState === "stopped") return;
    cutOffActiveNotes(getAudioContext().currentTime);
    playbackState = "stopped";
    pausedOffsetSeconds = 0;
  }

  function cutOffActiveNotes(now: number): void {
    for (const note of activeNotes) note.stopNow(now);
    for (const id of activeTimeouts) clearTimeout(id);
    activeNotes = [];
    activeTimeouts = [];
    for (const key of KEY_BY_NOTE.values()) setKeyHeld(root, key, false);
  }

  els.cover.addEventListener("click", open);
  els.close.addEventListener("click", close);
  els.prev.addEventListener("click", () => goToPage(-1));
  els.next.addEventListener("click", () => goToPage(1));

  window.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") goToPage(-1);
    else if (event.key === "ArrowRight") goToPage(1);
  });

  // Re-render the open page's note-sequence text on a label-mode flip
  // without touching playback -- renderPage() rebuilds fresh controls
  // defaulting to "stopped", so restore the real playback state after.
  onLabelModeChange(() => {
    if (!isOpen) return;
    renderPage();
    updateControls();
  });
}

function flashKey(
  root: HTMLElement,
  key: string,
  startTime: number,
  duration: number,
  timeouts: number[],
): void {
  const delayMs = Math.max(0, (startTime - getAudioContext().currentTime) * 1000);
  timeouts.push(window.setTimeout(() => setKeyHeld(root, key, true), delayMs));
  timeouts.push(window.setTimeout(() => setKeyHeld(root, key, false), delayMs + duration * 1000));
}
