import { wireKeyboard } from "./keyboard";
import { wireMusicBook } from "./book";

const instrument = document.querySelector<HTMLElement>("#instrument");
const keyboard = document.querySelector<HTMLElement>("#keyboard");
if (instrument && keyboard) {
  wireKeyboard(instrument, keyboard);
}

const bookCover = document.querySelector<HTMLButtonElement>("#book-cover");
const bookPages = document.querySelector<HTMLElement>("#book-pages");
const bookPage = document.querySelector<HTMLElement>("#book-page");
const bookPrev = document.querySelector<HTMLButtonElement>("#book-prev");
const bookNext = document.querySelector<HTMLButtonElement>("#book-next");
const bookClose = document.querySelector<HTMLButtonElement>("#book-close");
const bookIndicator = document.querySelector<HTMLElement>("#book-page-indicator");
if (instrument && bookCover && bookPages && bookPage && bookPrev && bookNext && bookClose && bookIndicator) {
  wireMusicBook(instrument, {
    cover: bookCover,
    pages: bookPages,
    page: bookPage,
    prev: bookPrev,
    next: bookNext,
    close: bookClose,
    indicator: bookIndicator,
  });
}
