export enum BubbleBlockType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  EMBED = "embed",
  AUDIO = "audio",
}

export const TecpetBubblesBlockType: { [key in BubbleBlockType]: boolean } = {
  [BubbleBlockType.AUDIO]: true,
  [BubbleBlockType.IMAGE]: true,
  [BubbleBlockType.VIDEO]: true,
  [BubbleBlockType.EMBED]: false,
  [BubbleBlockType.TEXT]: true,
}
