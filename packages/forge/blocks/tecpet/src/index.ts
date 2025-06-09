import {createBlock} from "@typebot.io/forge";
import {createPet} from "./actions/createPet";
import {getBreeds} from "./actions/getBreeds";
import {getClient} from "./actions/getClient";
import {getConfigurations} from "./actions/getConfigurations";
import {getPets} from "./actions/getPets";
import {getSpecies} from "./actions/getSpecies";
import {auth} from "./auth";
import {TecpetLogo} from "./logo";
import {getBillingMethods} from "./actions/getBillingMethods";
import {getShopConfigurations} from "./actions/getShopConfigurations";
import {getCombos} from "./actions/getCombos";

export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [getConfigurations, getClient, getPets, getSpecies, createPet, getBreeds, getBillingMethods, getShopConfigurations, getCombos],
});
