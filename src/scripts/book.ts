import { getAudioContext, resumeOnFirstGesture } from "./audio/context";
import { HandpanNote } from "./audio/handpan";
import { KEY_BY_NOTE, NOTE_BY_KEY } from "./audio/notes";
import { TUNES, type Tune } from "./book-data";
import { renderMusicBook, setKeyHeld } from "./ui";

const NOTE_SECONDS = 0.4;
const GAP_SECONDS = 0.05;
const STEP_SECONDS = NOTE_SECONDS + GAP_SECONDS;

/** Wires the "open music book" button, the <dialog>, and each tune's "play
 * for me" button -- which schedules the tune through the same `HandpanNote`
 * voice the player's own keys use, and flashes each key as it sounds so a
 * note name and its keyboard letter read as the same thing. */
export function wireMusicBook(
  root: HTMLElement,
  openButton: HTMLButtonElement,
  dialog: HTMLDialogElement,
  tuneListEl: HTMLElement,
): void {
  renderMusicBook(tuneListEl, TUNES, (tune, playButton) => playTune(root, tune, playButton));

  openButton.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close(); // click on the backdrop
  });
}

function playTune(root: HTMLElement, tune: Tune, playButton: HTMLButtonElement): void {
  const ctx = getAudioContext();
  resumeOnFirstGesture(ctx);

  playButton.disabled = true;
  let time = ctx.currentTime + 0.05;

  for (const noteName of tune.notes) {
    const key = KEY_BY_NOTE.get(noteName);
    const def = key ? NOTE_BY_KEY.get(key) : undefined;
    if (key && def) {
      const voice = new HandpanNote(ctx, def.freq, time);
      voice.noteOff(time + NOTE_SECONDS);
      flashKey(root, key, time, NOTE_SECONDS);
    }
    time += STEP_SECONDS;
  }

  const totalMs = tune.notes.length * STEP_SECONDS * 1000;
  setTimeout(() => {
    playButton.disabled = false;
  }, totalMs);
}

function flashKey(root: HTMLElement, key: string, startTime: number, duration: number): void {
  const delayMs = Math.max(0, (startTime - getAudioContext().currentTime) * 1000);
  setTimeout(() => setKeyHeld(root, key, true), delayMs);
  setTimeout(() => setKeyHeld(root, key, false), delayMs + duration * 1000);
}
