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
import {buildSelectedAdditionals} from "./actions/internal/buildSelectedAdditionals";
import {getAvailableTimes} from "./actions/api/availableTimes/getAvailableTimes";
import {parseServiceSelection} from "./actions/parser/infoCollectionMenus.serviceSelection";
import {parseTimeSelection} from "./actions/parser/infoCollectionMenus.timeSelection";
import {parsePetInfo} from "./actions/parser/infoCollectionMenus.petInfo";
import {buildAvailableTimesOptions} from "./actions/internal/buildAvailableTimesOptions";
import {parseTakeAndBring} from "./actions/parser/infoCollectionMenus.takeAndBring";
import {parseGuidance} from "./actions/parser/infoCollectionMenus.guidance";

const buildActions = [
  parseServiceSelection,
  parseTimeSelection,
  parsePetInfo,
  parseTakeAndBring,
  parseGuidance,
  buildServiceOptions,
  buildSelectedAdditionals,
  buildAvailableTimesOptions
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
  getAvailableTimes,
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
