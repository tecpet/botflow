import {createBlock} from "@typebot.io/forge";
import {auth} from "./auth";
import {TecpetLogo} from "./logo";
import {getClient} from "./actions/getClient";
import {getConfigurations} from "./actions/getConfigurations";

export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [getConfigurations, getClient],
});
