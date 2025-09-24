import { createBlock } from "@typebot.io/forge";

import { endChat } from "./actions/endChat";
import { talkToAttendant } from "./actions/talkToAttendant";
import { auth } from "./auth";
import { TecpetLogo } from "./logo";

export const tecpetGatewayBlock = createBlock({
  id: "tecpet-gateway",
  name: "tecpet-gateway",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [talkToAttendant, endChat],
});
