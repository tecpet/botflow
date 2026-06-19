import { createActionHandler } from "@typebot.io/forge";
import { ChangeShopHandler, changeShop } from "./actions/changeShop";
import { EndChatHandler, endChat } from "./actions/endChat";
import { TalkToAttendantHandler, talkToAttendant } from "./actions/talkToAttendant";

export default [
  createActionHandler(talkToAttendant, { server: TalkToAttendantHandler }),
  createActionHandler(endChat, { server: EndChatHandler }),
  createActionHandler(changeShop, { server: ChangeShopHandler }),
];
