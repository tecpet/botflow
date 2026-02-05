import { createBlock } from "@typebot.io/forge";
import { getAvailableTimes } from "./actions/api/availableTimes/getAvailableTimes";
import { getRescheduleAvailableTimes } from "./actions/api/availableTimes/getRescheduleAvailableTimes";
import { getBillingMethods } from "./actions/api/billingMethod/getBillingMethods";
import { cancelBooking } from "./actions/api/booking/cancelBooking";
import { createBooking } from "./actions/api/booking/createBooking";
import { rescheduleBooking } from "./actions/api/booking/rescheduleBooking";
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
import { buildClientBookingsSummary } from "./actions/internal/buildClientBookingsSummary";
import { buildClientPetsSummary } from "./actions/internal/buildClientPetsSummary";
import { buildEmployeeOptions } from "./actions/internal/buildEmployeeOptions";
import { buildSelectedAdditionals } from "./actions/internal/buildSelectedAdditionals";
import { buildServiceOptions } from "./actions/internal/buildServiceOptions";
import { showGuidanceOptions } from "./actions/internal/showGuidanceOptions";
import { showSendingInfoItems } from "./actions/internal/showSendingInfoItems";
import { parseSelectedFluxInfoCollectionMenus } from "./actions/parser/selectedFlux.chatbotAction";
import { parseSelectedFluxSettings } from "./actions/parser/selectedFlux.settings";
import { validateTakeAndBringMinAdvanceHours } from "./actions/validations/validateTakeAndBringMinAdvanceHours";
import { verifyAvailableTimesOptionSelected } from "./actions/validations/veirifyAvailableTimesOptionSelected";
import { verifyBookingGuard } from "./actions/validations/verifyBookingGuard";
import { verifyInitialMessageToTrigger } from "./actions/validations/verifyInitialMessageToTrigger";
import { verifyInputedCpfText } from "./actions/validations/verifyInputedCpf";
import { verifyInputedDateText } from "./actions/validations/verifyInputedDateText";
import { verifySimilarBreedOptionSelected } from "./actions/validations/verifySimilarBreedOptionSelected";
import { auth } from "./auth";
import { TecpetLogo } from "./logo";

const buildActions = [
  parseSelectedFluxSettings,
  parseSelectedFluxInfoCollectionMenus,
  buildServiceOptions,
  buildSelectedAdditionals,
  buildAvailableTimesOptions,
  buildEmployeeOptions,
  showSendingInfoItems,
  showGuidanceOptions,
  buildClientBookingsSummary,
  buildClientPetsSummary,
];

const validations = [
  verifyInputedDateText,
  verifyAvailableTimesOptionSelected,
  verifyInputedCpfText,
  verifyBookingGuard,
  verifyInitialMessageToTrigger,
  validateTakeAndBringMinAdvanceHours,
  verifySimilarBreedOptionSelected,
];

const clientActions = [getClient, editClient, getClientSummary];

const petActions = [getPets, createPet, editPet];

const bookingActions = [
  createBooking,
  cancelBooking,
  rescheduleBooking,
  getRescheduleAvailableTimes,
];

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
  getFormattedMessages,
  ...clientActions,
  ...petActions,
  ...bookingActions,
  ...validations,
];
export const tecpetBlock = createBlock({
  id: "tecpet",
  name: "tecpet",
  tags: [],
  LightLogo: TecpetLogo,
  auth,
  actions: [...apiActions, ...buildActions],
});
