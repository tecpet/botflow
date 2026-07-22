import { createBlock } from "@typebot.io/forge";
import { getAvailableTimes } from "./actions/api/availableTimes/getAvailableTimes";
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
import { getServiceRecommendations } from "./actions/api/serviceRecommendation/getServiceRecommendations";
import { getShopConfigurations } from "./actions/api/shop/getShopConfigurations";
import { getSpecies } from "./actions/api/specie/getSpecies";
import { extractToken } from "./actions/api/token/extractToken";
import { buildAvailableTimesOptions } from "./actions/internal/buildAvailableTimesOptions";
import { buildChainShopOptions } from "./actions/internal/buildChainShopOptions";
import { buildClientBookingsSummary } from "./actions/internal/buildClientBookingsSummary";
import { buildClientPetsSummary } from "./actions/internal/buildClientPetsSummary";
import { buildEmployeeOptions } from "./actions/internal/buildEmployeeOptions";
import { buildSecondaryServiceOfferOptions } from "./actions/internal/buildSecondaryServiceOfferOptions";
import { buildSelectedAdditionals } from "./actions/internal/buildSelectedAdditionals";
import { buildServiceOptions } from "./actions/internal/buildServiceOptions";
import { showGuidanceOptions } from "./actions/internal/showGuidanceOptions";
import { showSendingInfoItems } from "./actions/internal/showSendingInfoItems";
import { parseSelectedFluxInfoCollectionMenus } from "./actions/parser/selectedFlux.chatbotAction";
import { parseSelectedFluxSettings } from "./actions/parser/selectedFlux.settings";
import { validateCancelMinAdvanceHours } from "./actions/validations/validateCancelMinAdvanceHours";
import { validateRescheduleMinAdvanceHours } from "./actions/validations/validateRescheduleMinAdvanceHours";
import { validateTakeAndBringMinAdvanceHours } from "./actions/validations/validateTakeAndBringMinAdvanceHours";
import { verifyAvailableTimesOptionSelected } from "./actions/validations/veirifyAvailableTimesOptionSelected";
import { verifyActiveShopSegments } from "./actions/validations/verifyActiveShopSegments";
import { verifyBookingGuard } from "./actions/validations/verifyBookingGuard";
import { verifyInitialMessageToTrigger } from "./actions/validations/verifyInitialMessageToTrigger";
import { verifyInputedCpfText } from "./actions/validations/verifyInputedCpf";
import { verifyInputedDateText } from "./actions/validations/verifyInputedDateText";
import { verifyShopTimeTable } from "./actions/validations/verifyShopTimeTable";
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
  buildSecondaryServiceOfferOptions,
  buildChainShopOptions,
];

const validations = [
  verifyInputedDateText,
  verifyAvailableTimesOptionSelected,
  verifyInputedCpfText,
  verifyBookingGuard,
  verifyShopTimeTable,
  verifyInitialMessageToTrigger,
  validateTakeAndBringMinAdvanceHours,
  validateCancelMinAdvanceHours,
  validateRescheduleMinAdvanceHours,
  verifySimilarBreedOptionSelected,
  verifyActiveShopSegments,
];

const clientActions = [getClient, editClient, getClientSummary];

const petActions = [getPets, createPet, editPet];

const bookingActions = [createBooking, cancelBooking, rescheduleBooking];

const apiActions = [
  extractToken,
  getConfigurations,
  getSpecies,
  getBreeds,
  getBillingMethods,
  getShopConfigurations,
  getCombos,
  getServiceRecommendations,
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
