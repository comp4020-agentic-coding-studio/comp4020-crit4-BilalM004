let ctx: AudioContext | null = null;

/** Shared AudioContext, created lazily so the page doesn't need a sound API
 * call before the player has done anything. */
export function getAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

/** Browsers start an AudioContext suspended until a user gesture. Call this
 * from inside the same pointerdown/keydown handler that triggers the first
 * note, so resume and note-on ride the same gesture. */
export function resumeOnFirstGesture(context: AudioContext): void {
  if (context.state === "suspended") {
    void context.resume();
  }
}
