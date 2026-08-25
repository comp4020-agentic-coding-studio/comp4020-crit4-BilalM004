# CRIT4 "An Instrument" — a real handpan, with a music book and a loop grid

Structure for the prototype, agreed in planning, to work through as separate
deliverables in future chats. Check off file-structure items as they land.

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
note → key themselves), each with an optional "play for me" button that
auto-plays the tune through the handpan's own voices. This replaced an
earlier plan for 3 dedicated keys imitating famous tech sounds (iPhone
alarm, Windows startup, a notification ding) — dropped in favour of the
book because it teaches the player real tunes on a real instrument instead
of a novelty, and sidesteps sourcing/copyright questions entirely (the
book's placeholder tunes are traditional/public-domain melodies, not
recreations of proprietary sounds). On top of both, a small **loop grid**:
a fixed-tempo clock, 2 loop slots, record/mute/clear per slot — deliberately
kept simple (no free-length recording, no speed/reverse remix controls).
Expressiveness comes from hold-duration shaping: the longer a key is held,
the more a live parameter (filter brightness / vibrato depth) moves, which
works identically across mouse, touch, and keyboard input and needs no
drag-tracking.

The repo currently is the unmodified Astro starter template —
`src/pages/index.astro` still has the placeholder h1/paragraph,
`src/scripts/main.ts` just has the starter's readiness flag. This plan
replaces that placeholder with the instrument.

## Feature scope (final, simplified)

1. **The handpan**: 10 keys (`a s d f g h j k l ;`) tuned to a real handpan
   scale — the classic Kurd (D minor), extended by one note to fill all 10:
   `a`=D3 (the low central "ding"), then ring notes A3 Bb3 C4 D4 E4 F4 G4 A4
   Bb4 clockwise from the top. This replaced an earlier one-octave chromatic
   run — a real handpan is tuned to a diatonic scale, not every semitone, and
   the irregular gaps (e.g. A3→Bb3 is a semitone, Bb3→C4 is a tone) are part
   of what makes it sound like a handpan rather than a keyboard. Each
   key/on-screen button triggers a **handpan-like struck note**
   (`HandpanNote`: 3 sine `Voice`s at 1x/2x/3x the fundamental, stacked
   gains, long ~1.8s decay) rather than a single raw oscillator. Attack/
   release still an ADSR-style gain envelope per partial; sustain while
   held, release on key-up/pointer-up. Every key shows its note name (large)
   and its QWERTY letter (small, in parentheses) as two distinct labels, so
   note names in the music book map back to something readable on the pan.
2. **Hold-duration expressiveness**: while a note is held, a `setTargetAtTime`
   ramp slowly increases a filter's cutoff (or a vibrato LFO's depth) so a
   quick tap sounds plain and a held note blooms — same code path for mouse,
   touch, and keyboard since it's driven by note-on/note-off timing, not
   pointer movement. For the handpan voice specifically this reads as the
   struck overtones blooming a little further before the strike decays,
   rather than a sustained tone brightening (a struck note isn't sustained
   by continued energy the way a bowed/blown one is).
3. **Music book**: an "Open music book" button opens a native `<dialog>`
   listing tunes as their note-name sequence (e.g. `C4 · C4 · G4 · G4 · ...`)
   — reference only, deliberately not the QWERTY letters, so the player has
   to translate note → key themselves using the labels on the pan. Each tune
   also has a small "Play for me" button that auto-plays it through the same
   `HandpanNote` voice, flashing each key `.held` as it sounds. The seed set
   (Twinkle Twinkle Little Star, Mary Had a Little Lamb, Ode to Joy) is a
   placeholder chosen only because every note they need already exists on
   this scale — meant to be replaced/expanded with whatever tunes get picked
   next, not a finished song list.
4. **Loop grid**: a single fixed clock (e.g. 4 beats at a set tempo) running
   via the standard Web Audio lookahead-scheduler pattern. 2 slots. Each slot:
   `record` (arms, captures whatever's played during the next full cycle),
   `mute/unmute` (toggle whether it plays back), `clear` (empty it). No
   speed/reverse controls, no free-length recording — this is a deliberate
   simplification.
5. **No written instructions on the page** — affordances only (key styling,
   loop slot states) — matching "a stranger can play it uninstructed." (The
   music book is the one exception, and it's opt-in — closed by default,
   reference material rather than instructions for the pan itself.)

## File structure

Each bullet is one deliverable to pick up in its own future chat:

- [x] `src/scripts/audio/context.ts` — `getAudioContext()` singleton +
  `resumeOnFirstGesture()` (context starts suspended; resume inside the
  first pointerdown/keydown handler, same event that triggers the first note).
- [x] `src/scripts/audio/voice.ts` — `Voice` class: oscillator(s) → filter →
  gain, `noteOn(freq, startTime)` / `noteOff(time)`, owns the hold-duration
  ramp. Reused by both the normal keyboard and the tune-key sequences.
  (Extended with an options object -- type/attack/release/peakGain/cutoffs/
  detune -- so tune sequences can override the envelope per-note; still one
  oscillator per Voice.)
- [x] `src/scripts/audio/handpan.ts` — `HandpanNote` class: the handpan's
  timbre. Stacks 3 `Voice` instances (sine, ratios 1x/2x/3x the fundamental,
  decreasing gain) sharing one strike time and release, giving an
  inharmonic-ish, long-decay struck tone instead of a single-oscillator
  pluck.
- [x] `src/scripts/audio/notes.ts` — `HANDPAN_NOTES`: the 10 (key, note
  name, frequency) definitions for the Kurd-scale handpan, plus
  `NOTE_BY_KEY`/`KEY_BY_NOTE` lookup maps shared by the keyboard and the
  music book (so a book entry's note name resolves back to a key + frequency
  without either module owning the table).
  (`src/scripts/audio/tunes.ts` -- the old 3-tune-key motif synthesis --
  was deleted when the tune keys were removed in favour of the music book.)
- [ ] `src/scripts/audio/loop.ts` — `LoopGrid` class: lookahead scheduler
  (setInterval polling `currentTime` against a beat grid, per the standard
  Web Audio timing pattern), 2 `LoopSlot`s each holding a recorded event
  list, `record()/mute()/clear()`.
- [ ] `src/scripts/keyboard.ts` — key map (computer key → note, via
  `audio/notes.ts`), wires `keydown`/`keyup` (deduped against OS key-repeat)
  and `pointerdown`/`pointerup`/`pointerleave` on the on-screen buttons to
  the same trigger functions, and feeds every triggered note into the loop
  grid's active recording slot (if any).
  Note dispatch + keydown/keyup + pointer wiring done; feeding the loop grid
  still pending. (The old 3 dedicated tune keys and their z/x/c dispatch
  were removed — that feature is now the music book, wired separately in
  `book.ts`.)
- [x] `src/scripts/book-data.ts` — `TUNES`: the music book's placeholder
  tune list (title + note-name sequence), a seed set to replace/expand
  later, not a finished song list.
- [x] `src/scripts/book.ts` — wires the "Open music book" button, the
  `<dialog>`, and each tune's "Play for me" button, which schedules the
  tune through `HandpanNote` (resolving note name → key → frequency via
  `audio/notes.ts`) and flashes the matching key `.held` as each note
  sounds. Disables a tune's play button for the duration of its own
  playback so repeated clicks can't stack overlapping schedules.
- [ ] `src/scripts/ui.ts` — renders the on-screen keyboard and the music
  book list as real `<button>`/`<article>` elements with accessible
  labels, active/held visual state, and the loop slot controls +
  playing/muted/empty indicators. Handpan and music-book rendering +
  held-state toggle done; loop slot controls still pending. The 10 note
  keys render as `renderHandpan()`: a drawn (SVG, not photographed — no
  image licence to track) handpan shell with real `<button>`s on the
  ring-around-a-centre-"ding" positions a handpan's tone fields actually
  sit in, each showing its note name and QWERTY letter as two distinct
  labels. `renderMusicBook()` renders each tune's title, note sequence, and
  play button.
- [x] `src/scripts/main.ts` — replaces the starter placeholder; wires the
  keyboard and the music book together. (Runs as an Astro module script
  placed after the markup, so no `DOMContentLoaded` listener is needed —
  will need one added if loop wiring moves earlier in the page.)
- [ ] `src/pages/index.astro` — replace the placeholder `<h1>`/paragraph with
  the instrument's container markup (single `h1` kept, `nav` landmark kept
  as-is per the invariants); update `Layout`'s `description` prop to
  describe the instrument for the og-card/meta-description invariants.
  `<h1>`, description, `#keyboard`, the "Open music book" button, and the
  `#music-book` dialog + `#tune-list` container done; loop-grid markup still
  pending.
- [ ] `spec/instrument.test.ts` — new spec test file (alongside
  `invariants.test.ts`) asserting the mechanically-checkable contract lines:
  every key/loop control is a real `<button>` with an accessible name (keyboard
  operability), the built page ships no `<audio>` tag and no `.mp3`/`.wav`
  reference (enforcing "generated live, not played back" as a standing
  convention), and the tune/loop controls are present in the DOM. Expressive
  feel and "stranger can play it" stay for the live crit per `spec/README.md`.
- [ ] `CLAUDE.md` — add a short section recording the "no audio sample files —
  everything synthesized" convention and the hold-duration expressiveness
  pattern, per this repo's own instruction to grow the harness as
  conventions emerge.

## Verification (once features land)

- `pnpm dev`, open in a browser: click/tap and use the mapped keyboard keys,
  confirm first interaction resumes the (initially suspended) `AudioContext`
  and produces sound with no prior instruction.
- Check hold-duration shaping audibly (tap vs. hold a key).
- Open the music book, confirm the note-name sequences read clearly, and
  press "Play for me" on a tune: confirm it plays through once, flashes the
  matching keys as it goes, and its button re-enables when done with no
  stuck `.held` state even if the dialog is closed mid-playback.
- Record into both loop slots, mute/unmute/clear each, confirm no state can
  get "stuck" (no fail states).
- `pnpm check` (typecheck + build + vitest, including the new
  `spec/instrument.test.ts` and unchanged `invariants.test.ts`).
- Resize/check in Chrome DevTools at both marking viewports (1920×1080 and
  390×844) since that's the actual marking environment — confirm keys and
  loop controls are usable (tap targets, layout) at the phone size.

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
