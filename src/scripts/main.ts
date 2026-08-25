import { wireKeyboard } from "./keyboard";
import { wireMusicBook } from "./book";

const instrument = document.querySelector<HTMLElement>("#instrument");
const keyboard = document.querySelector<HTMLElement>("#keyboard");
if (instrument && keyboard) {
  wireKeyboard(instrument, keyboard);
}

const openBook = document.querySelector<HTMLButtonElement>("#open-book");
const bookDialog = document.querySelector<HTMLDialogElement>("#music-book");
const tuneList = document.querySelector<HTMLElement>("#tune-list");
if (instrument && openBook && bookDialog && tuneList) {
  wireMusicBook(instrument, openBook, bookDialog, tuneList);
}
