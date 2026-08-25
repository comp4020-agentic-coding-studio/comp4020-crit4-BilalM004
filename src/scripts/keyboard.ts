import { getAudioContext, resumeOnFirstGesture } from "./audio/context";
import { Voice } from "./audio/voice";
import { renderKeyboard, setKeyHeld } from "./ui";

/** QWERTY home row, white-key style -- the common web-synth convention. */
export const KEY_ORDER = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"] as const;

function noteFrequency(semitonesFromA4: number): number {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// C4 through A4, one semitone per key.
const KEY_FREQUENCIES: ReadonlyMap<string, number> = new Map(
  KEY_ORDER.map((key, index) => [key, noteFrequency(index - 9)]),
);

/** Renders the on-screen keyboard into `container` and wires pointer and
 * physical-key input to the same note-on/note-off path. */
export function wireKeyboard(container: HTMLElement): void {
  renderKeyboard(container, KEY_ORDER);

  const activeVoices = new Map<string, Voice>();

  function noteOn(key: string): void {
    if (activeVoices.has(key)) return; // already sounding -- ignore OS key-repeat
    const freq = KEY_FREQUENCIES.get(key);
    if (freq === undefined) return;

    const ctx = getAudioContext();
    resumeOnFirstGesture(ctx);

    const voice = new Voice(ctx);
    voice.noteOn(freq, ctx.currentTime);
    activeVoices.set(key, voice);
    setKeyHeld(container, key, true);
  }

  function noteOff(key: string): void {
    const voice = activeVoices.get(key);
    if (!voice) return;

    voice.noteOff(getAudioContext().currentTime);
    activeVoices.delete(key);
    setKeyHeld(container, key, false);
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    noteOn(event.key.toLowerCase());
  });
  window.addEventListener("keyup", (event) => {
    noteOff(event.key.toLowerCase());
  });

  for (const button of container.querySelectorAll<HTMLButtonElement>("[data-key]")) {
    const key = button.dataset.key;
    if (!key) continue;
    button.addEventListener("pointerdown", () => noteOn(key));
    button.addEventListener("pointerup", () => noteOff(key));
    button.addEventListener("pointerleave", () => noteOff(key));
    button.addEventListener("pointercancel", () => noteOff(key));
  }
}
