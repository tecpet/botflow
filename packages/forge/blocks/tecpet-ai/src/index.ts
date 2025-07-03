import {createBlock} from "@typebot.io/forge";
import {auth} from "./auth";
import {TecpetLogo} from "./logo";
import {startChat} from "./actions/startChat";
import {continueChat} from "./actions/continueChat";
import {speechToText} from "./actions/speechToText";

export const tecpetAiBlock = createBlock({
  id: "tecpet-ai",
  name: "tecpet-ai",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [startChat, continueChat, speechToText],
});
