import {createBlock} from "@typebot.io/forge";
import {createPet} from "./actions/api/pet/createPet";
import {getBreeds} from "./actions/api/breed/getBreeds";
import {getClient} from "./actions/api/client/getClient";
import {getConfigurations} from "./actions/api/chatbotSettings/getConfigurations";
import {getPets} from "./actions/api/pet/getPets";
import {getSpecies} from "./actions/api/specie/getSpecies";
import {auth} from "./auth";
import {TecpetLogo} from "./logo";
import {getBillingMethods} from "./actions/api/billingMethod/getBillingMethods";
import {getShopConfigurations} from "./actions/api/shop/getShopConfigurations";
import {getCombos} from "./actions/api/combo/getCombos";
import {getCategoriesAndServices} from "./actions/api/service/getCategoriesAndServices";
import {buildServiceOptions} from "./actions/internal/buildServiceOptions";
import {buildServiceSelectionSettings} from "./actions/internal/buildServiceSelection";
import {buildSelectedAdditionals} from "./actions/internal/buildSelectedAdditionals";

const buildActions = [
  buildServiceSelectionSettings,
  buildServiceOptions,
  buildSelectedAdditionals
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
