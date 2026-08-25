/** Renders the on-screen keyboard as real, labelled buttons -- keyboard
 * operability and screen-reader affordance come for free from using
 * <button> instead of a styled <div>. */
export function renderKeyboard(container: HTMLElement, keys: readonly string[]): void {
  container.innerHTML = "";
  for (const key of keys) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key";
    button.dataset.key = key;
    button.setAttribute("aria-label", `Play note ${key.toUpperCase()}`);
    button.textContent = key.toUpperCase();
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
