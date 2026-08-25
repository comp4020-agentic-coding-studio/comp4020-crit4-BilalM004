import { wireKeyboard } from "./keyboard";

const keyboard = document.querySelector<HTMLElement>("#keyboard");
if (keyboard) {
  wireKeyboard(keyboard);
}
