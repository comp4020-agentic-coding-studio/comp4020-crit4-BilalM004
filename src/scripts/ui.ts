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
 * Each key shows the note it sounds (large) and the QWERTY letter it's
 * mapped to (small) as two distinct labels, since the music book below
 * refers to notes, not letters. Keyboard operability and screen-reader
 * affordance still come from using <button> instead of a styled <div>. */
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
    button.innerHTML = `<span class="note-name">${noteName}</span><span class="note-key-letter">(${key.toUpperCase()})</span>`;
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

/** Renders each tune as its title and its note-name sequence -- reference
 * only, so the player has to find the notes on the handpan themselves --
 * plus a small "play for me" button that calls back into `onPlay` with the
 * button itself (so the caller can disable it for the duration of playback). */
export function renderMusicBook(
  container: HTMLElement,
  tunes: readonly TuneDisplay[],
  onPlay: (tune: TuneDisplay, playButton: HTMLButtonElement) => void,
): void {
  container.innerHTML = "";
  for (const tune of tunes) {
    const entry = document.createElement("article");
    entry.className = "tune";

    const heading = document.createElement("h3");
    heading.textContent = tune.title;

    const sequence = document.createElement("p");
    sequence.className = "tune-notes";
    sequence.textContent = tune.notes.join(" · ");

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "tune-play";
    playButton.textContent = "Play for me";
    playButton.setAttribute("aria-label", `Play ${tune.title}`);
    playButton.addEventListener("click", () => onPlay(tune, playButton));

    entry.append(heading, sequence, playButton);
    container.appendChild(entry);
  }
}

export function setKeyHeld(root: ParentNode, key: string, held: boolean): void {
  const button = root.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
  button?.classList.toggle("held", held);
}
