import { wireKeyboard } from "./keyboard";

const instrument = document.querySelector<HTMLElement>("#instrument");
const keyboard = document.querySelector<HTMLElement>("#keyboard");
const tuneKeys = document.querySelector<HTMLElement>("#tune-keys");
if (instrument && keyboard && tuneKeys) {
  wireKeyboard(instrument, keyboard, tuneKeys);
}
