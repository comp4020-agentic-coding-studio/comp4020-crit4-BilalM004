import { wireKeyboard } from "./keyboard";
import { wireMusicBook } from "./book";
import { getLabelMode, onLabelModeChange, setLabelMode, type LabelMode } from "./label-mode";

const instrument = document.querySelector<HTMLElement>("#instrument");
const keyboard = document.querySelector<HTMLElement>("#keyboard");
if (instrument && keyboard) {
  wireKeyboard(instrument, keyboard);
}

const labelToggle = document.querySelector<HTMLButtonElement>("#label-toggle");
const instrumentLegend = document.querySelector<HTMLElement>("#instrument-legend");
const bookLegend = document.querySelector<HTMLElement>("#book-legend");
if (keyboard && labelToggle) {
  labelToggle.addEventListener("click", () => {
    setLabelMode(getLabelMode() === "notes" ? "keys" : "notes");
  });
  const applyLabelMode = (mode: LabelMode): void => {
    keyboard.classList.toggle("show-letters", mode === "keys");
    labelToggle.textContent = mode === "keys" ? "Show note names" : "Show keyboard letters";
    labelToggle.setAttribute("aria-pressed", String(mode === "keys"));
    if (instrumentLegend) {
      instrumentLegend.textContent =
        mode === "keys"
          ? "Bold shows the keyboard letter; the note it plays is in parentheses."
          : "Bold shows the note name; its keyboard letter is in parentheses.";
    }
    if (bookLegend) {
      bookLegend.textContent = mode === "keys" ? "Tune notes shown as keyboard letters." : "Tune notes shown as note names.";
    }
  };
  applyLabelMode(getLabelMode());
  onLabelModeChange(applyLabelMode);
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
