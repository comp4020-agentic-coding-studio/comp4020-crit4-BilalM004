# CRIT4 "An Instrument" — mini synth keyboard with tune keys and a loop grid

Structure for the prototype, agreed in planning, to work through as separate
deliverables in future chats. Check off file-structure items as they land.

## Context

Crit4's brief requires a browser-based musical instrument: sound generated
live via the Web Audio API in response to pointer/keyboard/touch, expressive
enough that two players sound different, intuitive enough that a stranger
plays it uninstructed, with no fail states. The spec explicitly allows both
`OscillatorNode` and `AudioBufferSourceNode` as sound sources, but rules out
"played back" — a fixed clip firing with no per-gesture shaping.

The concept: a normal playable keyboard (QWERTY-mapped, one voice per key)
plus a handful of **dedicated keys** that each trigger a short synthesized
motif evoking a famous tech sound (iPhone-alarm-ish pluck, Windows-startup-ish
chord swell, a notification-bell FM ding) — synthesized from oscillators, not
sampled from real recordings (avoids both the "played back" spec risk and a
copyright risk from shipping Apple/Microsoft's actual system sounds). On top
of both, a small **loop grid**: a fixed-tempo clock, 2 loop slots,
record/mute/clear per slot — deliberately kept simple (no free-length
recording, no speed/reverse remix controls). Expressiveness comes from
hold-duration shaping: the longer a key (normal or tune) is held, the more a
live parameter (filter brightness / vibrato depth) moves, which works
identically across mouse, touch, and keyboard input and needs no
drag-tracking.

The repo currently is the unmodified Astro starter template —
`src/pages/index.astro` still has the placeholder h1/paragraph,
`src/scripts/main.ts` just has the starter's readiness flag. This plan
replaces that placeholder with the instrument.

## Feature scope (final, simplified)

1. **Normal keyboard**: ~10 keys mapped to a one-octave-plus chromatic run on
   the home row (`a s d f g h j k l ;` white-key style, matching the common
   web-synth QWERTY convention referenced by MDN's simple synth example).
   Each key/on-screen button is one oscillator voice with an ADSR-style gain
   envelope: fast attack, sustain while held, release on key-up/pointer-up.
2. **Hold-duration expressiveness**: while a note is held, a `setTargetAtTime`
   ramp slowly increases a filter's cutoff (or a vibrato LFO's depth) so a
   quick tap sounds plain and a held note blooms — same code path for mouse,
   touch, and keyboard since it's driven by note-on/note-off timing, not
   pointer movement.
3. **3 dedicated "tune" keys**, visually distinct (different key colour +
   icon/label), each triggering a short scheduled sequence of oscillator
   notes built from the same voice primitive:
   - alarm: fast alternating two-tone pluck, repeated 3x
   - startup: a slow-attack stacked chord (3-4 detuned oscillators)
   - notification: a two-oscillator FM bell hit with a quick decay
4. **Loop grid**: a single fixed clock (e.g. 4 beats at a set tempo) running
   via the standard Web Audio lookahead-scheduler pattern. 2 slots. Each slot:
   `record` (arms, captures whatever's played during the next full cycle),
   `mute/unmute` (toggle whether it plays back), `clear` (empty it). No
   speed/reverse controls, no free-length recording — this is a deliberate
   simplification.
5. **No written instructions on the page** — affordances only (key styling,
   loop slot states) — matching "a stranger can play it uninstructed."

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
- [x] `src/scripts/audio/tunes.ts` — the 3 tune definitions and a
  `playTune(id, ctx)` function that schedules `Voice` instances (alarm,
  startup) or a small dedicated FM node graph (notification -- FM needs a
  modulator patched into the carrier's frequency, a different shape than
  Voice's static filter chain, so it isn't built through Voice).
- [ ] `src/scripts/audio/loop.ts` — `LoopGrid` class: lookahead scheduler
  (setInterval polling `currentTime` against a beat grid, per the standard
  Web Audio timing pattern), 2 `LoopSlot`s each holding a recorded event
  list, `record()/mute()/clear()`.
- [ ] `src/scripts/keyboard.ts` — key map (computer key → note freq or tune id),
  wires `keydown`/`keyup` (deduped against OS key-repeat) and
  `pointerdown`/`pointerup`/`pointerleave` on the on-screen buttons to the
  same trigger functions, and feeds every triggered note into the loop
  grid's active recording slot (if any).
  Note map + tune-id dispatch (z/x/c → alarm/startup/notification) +
  keydown/keyup + pointer wiring all done; feeding the loop grid still
  pending.
- [ ] `src/scripts/ui.ts` — renders the on-screen keyboard (normal keys + 3 tune
  keys as real `<button>` elements with accessible labels), active/held
  visual state, and the loop slot controls + playing/muted/empty indicators.
  Normal-key and tune-key rendering + held-state toggle done; loop slot
  controls still pending.
- [x] `src/scripts/main.ts` — replaces the starter placeholder; wires the above
  together. (Runs as an Astro module script placed after the markup, so no
  `DOMContentLoaded` listener is needed — will need one added if loop
  wiring moves earlier in the page.)
- [ ] `src/pages/index.astro` — replace the placeholder `<h1>`/paragraph with
  the instrument's container markup (single `h1` kept, `nav` landmark kept
  as-is per the invariants); update `Layout`'s `description` prop to
  describe the instrument for the og-card/meta-description invariants.
  `<h1>`, description, `#tune-keys` and `#keyboard` containers done;
  loop-grid markup still pending.
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
- Trigger each of the 3 tune keys, confirm each plays its full motif once
  per press with no lingering/stuck state.
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
