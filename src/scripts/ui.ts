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

export function setKeyHeld(container: HTMLElement, key: string, held: boolean): void {
  const button = container.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
  button?.classList.toggle("held", held);
}
