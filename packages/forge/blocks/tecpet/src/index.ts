import { createBlock } from "@typebot.io/forge";
import { getAvailableTimes } from "./actions/api/availableTimes/getAvailableTimes";
import { getBillingMethods } from "./actions/api/billingMethod/getBillingMethods";
import { createBooking } from "./actions/api/booking/createBooking";
import { getBreeds } from "./actions/api/breed/getBreeds";
import { getConfigurations } from "./actions/api/chatbotSettings/getConfigurations";
import { getFormattedMessages } from "./actions/api/chatbotSettings/getFormattedMessages";
import { editClient } from "./actions/api/client/editClient";
import { getClient } from "./actions/api/client/getClient";
import { getClientSummary } from "./actions/api/client/getClientSummary";
import { getCombos } from "./actions/api/combo/getCombos";
import { getEmployess } from "./actions/api/employee/getEmployees";
import { createPet } from "./actions/api/pet/createPet";
import { editPet } from "./actions/api/pet/editPet";
import { getPets } from "./actions/api/pet/getPets";
import { getCategoriesAndServices } from "./actions/api/service/getCategoriesAndServices";
import { getShopConfigurations } from "./actions/api/shop/getShopConfigurations";
import { getSpecies } from "./actions/api/specie/getSpecies";
import { extractToken } from "./actions/api/token/extractToken";
import { buildAvailableTimesOptions } from "./actions/internal/buildAvailableTimesOptions";
import { buildEmployeeOptions } from "./actions/internal/buildEmployeeOptions";
import { buildSelectedAdditionals } from "./actions/internal/buildSelectedAdditionals";
import { buildSelectedFlux } from "./actions/internal/buildSelectedFlux";
import { buildServiceOptions } from "./actions/internal/buildServiceOptions";
import { parseSelectedFluxInfoCollectionMenus } from "./actions/parser/selectedFlux.infoCollectionMenus";
import { parseSelectedFluxSettings } from "./actions/parser/selectedFlux.settings";
import { verifyAvailableTimesOptionSelected } from "./actions/validations/veirifyAvailableTimesOptionSelected";
import { verifySimilarBreedOptionSelected } from "./actions/validations/verifySimilarBreedOptionSelected";
import { auth } from "./auth";
import { TecpetLogo } from "./logo";

const buildActions = [
  parseSelectedFluxSettings,
  parseSelectedFluxInfoCollectionMenus,
  buildSelectedFlux,
  buildServiceOptions,
  buildSelectedAdditionals,
  buildAvailableTimesOptions,
  buildEmployeeOptions,
  verifyAvailableTimesOptionSelected,
  verifySimilarBreedOptionSelected,
];

const clientActions = [getClient, editClient, getClientSummary];

const petActions = [getPets, createPet, editPet];

const apiActions = [
  extractToken,
  getConfigurations,
  getSpecies,
  getBreeds,
  getBillingMethods,
  getShopConfigurations,
  getCombos,
  getEmployess,
  getCategoriesAndServices,
  getAvailableTimes,
  createBooking,
  getFormattedMessages,
  ...clientActions,
  ...petActions,
];
export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [...buildActions, ...apiActions],
});
