export const defaultButtonLabel = "Send";

export enum InputBlockType {
  TEXT = "text input",
  NUMBER = "number input",
  EMAIL = "email input",
  URL = "url input",
  DATE = "date input",
  TIME = "time input",
  PHONE = "phone number input",
  CHOICE = "choice input",
  PICTURE_CHOICE = "picture choice input",
  PAYMENT = "payment input",
  RATING = "rating input",
  FILE = "file input",
  CARDS = "cards",
}

export const TecpetInputBlockType: { [key in InputBlockType]: boolean } = {
  [InputBlockType.TEXT]: true,
  [InputBlockType.NUMBER]: true,
  [InputBlockType.EMAIL]: true,
  [InputBlockType.URL]: false,
  [InputBlockType.DATE]: true,
  [InputBlockType.TIME]: true,
  [InputBlockType.PHONE]: true,
  [InputBlockType.CHOICE]: true,
  [InputBlockType.PICTURE_CHOICE]: true,
  [InputBlockType.PAYMENT]: false,
  [InputBlockType.RATING]: false,
  [InputBlockType.FILE]: true,
};
