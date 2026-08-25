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
 * Keyboard operability and screen-reader affordance still come from using
 * <button> instead of a styled <div>. */
export function renderHandpan(container: HTMLElement, keys: readonly string[]): void {
  container.innerHTML = HANDPAN_SHELL_SVG;
  for (const { key, xPercent, yPercent, sizePercent } of computeHandpanLayout(keys)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key note-key";
    button.dataset.key = key;
    button.setAttribute("aria-label", `Play note ${key.toUpperCase()}`);
    button.textContent = key.toUpperCase();
    button.style.left = `${xPercent}%`;
    button.style.top = `${yPercent}%`;
    button.style.width = `${sizePercent}%`;
    button.style.height = `${sizePercent}%`;
    container.appendChild(button);
  }
}

export interface TuneKeyInfo {
  key: string;
  label: string;
}

/** Renders the dedicated tune keys, visually distinct from note keys via
 * the shared "tune-key" class. */
export function renderTuneKeys(container: HTMLElement, tunes: readonly TuneKeyInfo[]): void {
  container.innerHTML = "";
  for (const { key, label } of tunes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key tune-key";
    button.dataset.key = key;
    button.setAttribute("aria-label", `Play ${label} sound`);
    button.textContent = label;
    container.appendChild(button);
  }
}

export function setKeyHeld(root: ParentNode, key: string, held: boolean): void {
  const button = root.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
  button?.classList.toggle("held", held);
}
