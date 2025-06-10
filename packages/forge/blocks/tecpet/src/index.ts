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
import {getCategoriesAndServices} from "./actions/getCategoriesAndServices";
import {buildServiceOptions} from "./actions/buildServiceOptions";
import {buildServiceSelectionSettings} from "./actions/buildServiceSelection";

const buildActions = [
  buildServiceSelectionSettings,
  buildServiceOptions,
]

const apiActions = [
  getConfigurations,
  getClient,
  getPets,
  getSpecies,
  createPet,
  getBreeds,
  getBillingMethods,
  getShopConfigurations,
  getCombos,
  getCategoriesAndServices,
]
export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [
    ...buildActions,
    ...apiActions,
  ],
});
