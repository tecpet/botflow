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
import {buildAvailableTimesOptions} from "./actions/internal/buildAvailableTimesOptions";
import {createBooking} from "./actions/api/booking/createBooking";
import {getFormattedMessages} from "./actions/api/chatbotSettings/getFormattedMessages";
import {parseSelectedFluxSettings} from "./actions/parser/selectedFlux.settings";
import {parseSelectedFluxInfoCollectionMenus} from "./actions/parser/selectedFlux.infoCollectionMenus";

const buildActions = [
  parseSelectedFluxSettings,
  parseSelectedFluxInfoCollectionMenus,
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
  createBooking,
  getFormattedMessages,
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
