# CRIT4 "An Instrument" — a real handpan, with a music book and a notepad

This documents the finished prototype, not a to-do list to keep working
through.

## Context

Crit4's brief requires a browser-based musical instrument: sound generated
live via the Web Audio API in response to pointer/keyboard/touch, expressive
enough that two players sound different, intuitive enough that a stranger
plays it uninstructed, with no fail states. The spec explicitly allows both
`OscillatorNode` and `AudioBufferSourceNode` as sound sources, but rules out
"played back" — a fixed clip firing with no per-gesture shaping.

The concept: a **handpan** (10 struck notes, QWERTY-mapped, one voice per
key, drawn as a ring-around-a-centre-"ding" shell) tuned to a real handpan
scale, plus an openable **music book**: a reference list of well-known
tunes as note-name sequences (not letters, so the player has to translate
note → key themselves), each with a "play for me" button that auto-plays the
tune through the handpan's own voices. This replaced an earlier plan for 3
dedicated keys imitating famous tech sounds (iPhone alarm, Windows startup, a
notification ding) — dropped in favour of the book because it teaches the
player real tunes on a real instrument instead of a novelty, and sidesteps
sourcing/copyright questions entirely (the book's placeholder tunes are
traditional/public-domain melodies, not recreations of proprietary sounds).

The handpan, music book, and notepad below are the final feature set.
Expressiveness comes from hold-duration shaping: the longer a key is held,
the more the filter cutoff drifts open, which works identically across
mouse, touch, and keyboard input and needs no drag-tracking.

Beyond the original plan, two things were added once the core instrument was
working: a **notes-played notepad** (a toggleable live transcript of what the
player plays, paginating like the book) and a **site split** into Play,
Examples, and Learn pages with a dark "stage" visual treatment, so the
single-page prototype reads as a small site rather than one dense screen.

## Feature scope (final)

1. **The handpan**: 10 keys (`a s d f g h j k l ;`) tuned to a real handpan
   scale — the classic Kurd (D minor), extended by one note to fill all 10:
   `a`=D3 (the low central "ding"), then ring notes A3 Bb3 C4 D4 E4 F4 G4 A4
   Bb4 clockwise from the top. A real handpan is tuned to a diatonic scale,
   not every semitone, and the irregular gaps (e.g. A3→Bb3 is a semitone,
   Bb3→C4 is a tone) are part of what makes it sound like a handpan rather
   than a keyboard. Each key/on-screen button triggers a **handpan-like
   struck note** (`HandpanNote`: 3 sine `Voice`s at 1x/2x/3x the fundamental,
   stacked gains, long ~1.8s decay) rather than a single raw oscillator.
   Attack/release is an ADSR-style gain envelope per partial; sustain while
   held, release on key-up/pointer-up. Every key shows its note name (large)
   and its QWERTY letter (small, in parentheses) as two distinct labels, so
   note names in the music book map back to something readable on the pan. A
   toggle flips which label reads as primary (note names vs. keyboard
   letters) across the pan, the book, and the notepad at once.
2. **Hold-duration expressiveness**: while a note is held, a
   `setTargetAtTime` ramp slowly increases the filter's cutoff so a quick tap
   sounds plain and a held note blooms — same code path for mouse, touch, and
   keyboard since it's driven by note-on/note-off timing, not pointer
   movement.
3. **Music book**: a "Music Book" cover opens to a page listing tunes as
   their note-name sequence (e.g. `D3 · A3 · Bb3 · ...`) — reference only,
   deliberately not the QWERTY letters by default, so the player has to
   translate note → key themselves using the labels on the pan. Each tune
   has a "play for me" button that auto-plays it through the same
   `HandpanNote` voice, flashing each key `.held` as it sounds, and disables
   itself for the duration of its own playback so repeated clicks can't stack
   overlapping schedules. Pause/resume mid-tune is supported. The seed set
   (Twinkle Twinkle Little Star, Mary Had a Little Lamb, Ode to Joy) is a
   placeholder chosen only because every note they need already exists on
   this scale.
4. **Notes-played notepad**: a "Record notes played" toggle in the notepad
   panel; once on, every note the player triggers live (keyboard or clicking
   the handpan) is appended to a running transcript, paginating automatically
   once a page fills up (20 notes/page) and always auto-advancing to the
   newest page as the player keeps going. Prev/next let the player look back
   at earlier pages; a Clear button resets it. Book tune playback is
   deliberately **not** recorded — only the player's own live playing counts.
5. **No written instructions on the page** — affordances only (key styling,
   toggle states) — matching "a stranger can play it uninstructed." (The
   music book and notepad are the exceptions, and both are opt-in — the book
   closed and the notepad off by default, reference material rather than
   instructions for the pan itself.)

## File structure

- [x] `src/scripts/audio/context.ts` — `getAudioContext()` singleton +
  `resumeOnFirstGesture()` (context starts suspended; resume inside the
  first pointerdown/keydown handler, same event that triggers the first note).
- [x] `src/scripts/audio/voice.ts` — `Voice` class: oscillator → filter →
  gain, `noteOn(freq, startTime)` / `noteOff(time)`, owns the hold-duration
  ramp. Reused by both the normal keyboard and the tune-key sequences.
- [x] `src/scripts/audio/handpan.ts` — `HandpanNote` class: the handpan's
  timbre. Stacks 3 `Voice` instances (sine, ratios 1x/2x/3x the fundamental,
  decreasing gain) sharing one strike time and release, giving an
  inharmonic-ish, long-decay struck tone instead of a single-oscillator
  pluck.
- [x] `src/scripts/audio/notes.ts` — `HANDPAN_NOTES`: the 10 (key, note
  name, frequency) definitions for the Kurd-scale handpan, plus
  `NOTE_BY_KEY`/`KEY_BY_NOTE` lookup maps shared by the keyboard, the music
  book, and the notepad.
- [x] `src/scripts/book-data.ts` — `TUNES`: the music book's placeholder
  tune list (title + note-name sequence).
- [x] `src/scripts/book.ts` — wires the book cover, the page-turning UI, and
  each tune's play/pause/stop controls, scheduling the tune through
  `HandpanNote` and flashing the matching key `.held` as each note sounds.
- [x] `src/scripts/label-mode.ts` — shared note-names/keyboard-letters toggle
  state (get/set/onChange) plus `formatNoteNames()`, used by the book and the
  notepad so both render the same label choice.
- [x] `src/scripts/note-recorder.ts` — recording state (get/set/onChange,
  same shape as `label-mode.ts`): `recordNote()` no-ops when recording is
  off, otherwise appends to the current page and rolls onto a new page once
  it reaches 20 notes.
- [x] `src/scripts/keyboard.ts` — key map (computer key → note, via
  `audio/notes.ts`), wires `keydown`/`keyup` (deduped against OS key-repeat)
  and `pointerdown`/`pointerup`/`pointerleave` on the on-screen buttons to
  the same trigger functions, and calls `recordNote()` on every live note
  trigger.
- [x] `src/scripts/notepad.ts` — wires the record toggle, the notepad's
  page-turning UI (mirrors the book's), and the Clear button; auto-advances
  to the newest page as notes are recorded.
- [x] `src/scripts/ui.ts` — renders the on-screen keyboard (`renderHandpan`,
  a drawn SVG shell with real `<button>`s on the ring-around-a-centre-"ding"
  positions, each showing note name + QWERTY letter), the music book pages
  (`renderBookPage`), and the notepad pages (`renderNotepadPage`, including
  its empty-state placeholder text).
- [x] `src/scripts/main.ts` — wires the keyboard, label toggle, music book,
  and notepad together.
- [x] `src/pages/index.astro` (Play) — the handpan, music book, and notepad
  laid out as a "stage" of panels, with the label-mode toggle above.
- [x] `src/pages/examples.astro` (Examples) — split out of the single-page
  prototype.
- [x] `src/pages/learn.astro` (Learn) — split out of the single-page
  prototype.
- [x] `spec/invariants.test.ts` — per-page mechanical checks (lang attr,
  title, meta description, og:image, viewport, nav landmark, one `<h1>`,
  alt text) run across all three built pages.

## Verification

- `pnpm dev`, open in a browser: click/tap and use the mapped keyboard keys,
  confirm first interaction resumes the (initially suspended) `AudioContext`
  and produces sound with no prior instruction.
- Check hold-duration shaping audibly (tap vs. hold a key).
- Open the music book, confirm the note-name sequences read clearly, and
  press play on a tune: confirm it plays through once, flashes the matching
  keys as it goes, pause/resume works, and its button re-enables when done.
- Turn on "Record notes played", play more than 20 notes, confirm a second
  page starts and the view auto-advances; check prev/next bounds and that
  Clear resets to one empty page. Confirm playing a book tune does **not**
  add entries to the notepad.
- Flip the note-names/keyboard-letters toggle and confirm the pan, book, and
  notepad all update together.
- `pnpm check` (typecheck + build + vitest against `invariants.test.ts`,
  which scales to however many pages are built).
- Resize/check in Chrome DevTools at both marking viewports (1920×1080 and
  390×844) since that's the actual marking environment.

## Spec reference

Crit4 brief: "an instrument" —
https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/04-instrument/
Key requirement lines pulled from that page:

- "the browser is the instrument — sound is made live in the page by the
  player, not played back"
- "it is expressive: the player's choices shape what they hear, and two
  players sound different"
- "a stranger can play it uninstructed — the opening screen invites the
  first sound"
- "playable with whatever is at hand — mouse, keyboard or touch"
- "there is no way to play it wrong — no score, no fail state"
- "the starter's invariant checks pass"
