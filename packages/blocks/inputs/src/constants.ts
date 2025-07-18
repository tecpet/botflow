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

export const replyEventInputTypeFromEnum = {
  [InputBlockType.TEXT]: "text",
  [InputBlockType.NUMBER]: "number",
  [InputBlockType.EMAIL]: "email",
  [InputBlockType.URL]: "url",
  [InputBlockType.DATE]: "date",
  [InputBlockType.TIME]: "time",
  [InputBlockType.PHONE]: "phone",
  [InputBlockType.CHOICE]: "buttons",
  [InputBlockType.PICTURE_CHOICE]: "picture choice",
  [InputBlockType.PAYMENT]: "payment",
  [InputBlockType.RATING]: "rating",
  [InputBlockType.FILE]: "file",
  [InputBlockType.CARDS]: "cards",
};

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
  [InputBlockType.CARDS]: false,
};
