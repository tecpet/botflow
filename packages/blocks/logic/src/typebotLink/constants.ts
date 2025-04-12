import type { TypebotLinkBlock } from "./schema";

export const defaultTypebotLinkOptions = {
  mergeResults: false,
  fluxByVariable: false,
} as const satisfies TypebotLinkBlock["options"];
