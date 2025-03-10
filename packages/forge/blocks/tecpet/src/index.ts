import { createBlock } from "@typebot.io/forge";
import { auth } from "./auth";
import { TecpetLogo } from "./logo";
import {getClient} from "./actions/getClient";

export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [getClient],
});
