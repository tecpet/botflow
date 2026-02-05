import { createActionHandler } from "@typebot.io/forge";
import {
  GetAvailableTimesHandler,
  getAvailableTimes,
} from "./actions/api/availableTimes/getAvailableTimes";
import {
  GetRescheduleAvailableTimesHandler,
  getRescheduleAvailableTimes,
} from "./actions/api/availableTimes/getRescheduleAvailableTimes";
import {
  GetBillingMethodsHandler,
  getBillingMethods,
} from "./actions/api/billingMethod/getBillingMethods";
import {
  CancelBookingHandler,
  cancelBooking,
} from "./actions/api/booking/cancelBooking";
import {
  CreateBookingHandler,
  createBooking,
} from "./actions/api/booking/createBooking";
import {
  RescheduleBookingHandler,
  rescheduleBooking,
} from "./actions/api/booking/rescheduleBooking";
import { GetBreedsHandler, getBreeds } from "./actions/api/breed/getBreeds";
import {
  GetConfigurationsHandler,
  getConfigurations,
} from "./actions/api/chatbotSettings/getConfigurations";
import {
  GetFormattedMessagesHandler,
  getFormattedMessages,
} from "./actions/api/chatbotSettings/getFormattedMessages";
import { EditClientHandler, editClient } from "./actions/api/client/editClient";
import { GetClientHandler, getClient } from "./actions/api/client/getClient";
import {
  getClientSummary,
  getClientSummaryHandler,
} from "./actions/api/client/getClientSummary";
import { GetCombosHandler, getCombos } from "./actions/api/combo/getCombos";
import {
  GetEmployessHandler,
  getEmployess,
} from "./actions/api/employee/getEmployees";
import { CreatePetHandler, createPet } from "./actions/api/pet/createPet";
import { EditPetHandler, editPet } from "./actions/api/pet/editPet";
import { GetPetsHandler, getPets } from "./actions/api/pet/getPets";
import {
  GetCategoriesAndServicesHandler,
  getCategoriesAndServices,
} from "./actions/api/service/getCategoriesAndServices";
import {
  GetShopConfigurationsHandler,
  getShopConfigurations,
} from "./actions/api/shop/getShopConfigurations";
import { GetSpeciesHandler, getSpecies } from "./actions/api/specie/getSpecies";
import {
  ExtractTokenHandler,
  extractToken,
} from "./actions/api/token/extractToken";
import {
  BuildAvailableTimesOptionsHandler,
  buildAvailableTimesOptions,
} from "./actions/internal/buildAvailableTimesOptions";
import {
  BuildClientBookingsSummaryHandler,
  buildClientBookingsSummary,
} from "./actions/internal/buildClientBookingsSummary";
import {
  BuildClientPetsSummaryHandler,
  buildClientPetsSummary,
} from "./actions/internal/buildClientPetsSummary";
import {
  BuildEmployeeOptionsHandler,
  buildEmployeeOptions,
} from "./actions/internal/buildEmployeeOptions";
import {
  BuildSelectedAdditionalsHandler,
  buildSelectedAdditionals,
} from "./actions/internal/buildSelectedAdditionals";
import {
  BuildServiceOptionsHandler,
  buildServiceOptions,
} from "./actions/internal/buildServiceOptions";
import {
  ShowGuidanceOptionsHandler,
  showGuidanceOptions,
} from "./actions/internal/showGuidanceOptions";
import {
  ShowSendingInfoItemsHandler,
  showSendingInfoItems,
} from "./actions/internal/showSendingInfoItems";
import {
  ParseSelectedFluxInfoCollectionMenusHandler,
  parseSelectedFluxInfoCollectionMenus,
} from "./actions/parser/selectedFlux.chatbotAction";
import {
  ParseSelectedFluxSettingsHandler,
  parseSelectedFluxSettings,
} from "./actions/parser/selectedFlux.settings";
import {
  ValidateTakeAndBringMinAdvanceHoursHandler,
  validateTakeAndBringMinAdvanceHours,
} from "./actions/validations/validateTakeAndBringMinAdvanceHours";
import {
  VerifyAvailableTimesOptionSelectedHandler,
  verifyAvailableTimesOptionSelected,
} from "./actions/validations/veirifyAvailableTimesOptionSelected";
import {
  VerifyBookingGuardHandler,
  verifyBookingGuard,
} from "./actions/validations/verifyBookingGuard";
import {
  VerifyInitialMessageToTriggerHandler,
  verifyInitialMessageToTrigger,
} from "./actions/validations/verifyInitialMessageToTrigger";
import {
  VerifyInputedCpfTextHandler,
  verifyInputedCpfText,
} from "./actions/validations/verifyInputedCpf";
import {
  VerifyInputedDateTextHandler,
  verifyInputedDateText,
} from "./actions/validations/verifyInputedDateText";
import {
  VerifySimilarBreedOptionSelectedHandler,
  verifySimilarBreedOptionSelected,
} from "./actions/validations/verifySimilarBreedOptionSelected";

export default [
  createActionHandler(getAvailableTimes, { server: GetAvailableTimesHandler }),
  createActionHandler(getRescheduleAvailableTimes, {
    server: GetRescheduleAvailableTimesHandler,
  }),
  createActionHandler(getBillingMethods, { server: GetBillingMethodsHandler }),
  createActionHandler(cancelBooking, { server: CancelBookingHandler }),
  createActionHandler(createBooking, { server: CreateBookingHandler }),
  createActionHandler(rescheduleBooking, { server: RescheduleBookingHandler }),
  createActionHandler(getBreeds, { server: GetBreedsHandler }),
  createActionHandler(getConfigurations, { server: GetConfigurationsHandler }),
  createActionHandler(getFormattedMessages, {
    server: GetFormattedMessagesHandler,
  }),
  createActionHandler(editClient, { server: EditClientHandler }),
  createActionHandler(getClient, { server: GetClientHandler }),
  createActionHandler(getClientSummary, { server: getClientSummaryHandler }),
  createActionHandler(getCombos, { server: GetCombosHandler }),
  createActionHandler(getEmployess, { server: GetEmployessHandler }),
  createActionHandler(createPet, { server: CreatePetHandler }),
  createActionHandler(editPet, { server: EditPetHandler }),
  createActionHandler(getPets, { server: GetPetsHandler }),
  createActionHandler(getCategoriesAndServices, {
    server: GetCategoriesAndServicesHandler,
  }),
  createActionHandler(getShopConfigurations, {
    server: GetShopConfigurationsHandler,
  }),
  createActionHandler(getSpecies, { server: GetSpeciesHandler }),
  createActionHandler(extractToken, { server: ExtractTokenHandler }),
  createActionHandler(buildAvailableTimesOptions, {
    server: BuildAvailableTimesOptionsHandler,
  }),
  createActionHandler(buildClientBookingsSummary, {
    server: BuildClientBookingsSummaryHandler,
  }),
  createActionHandler(buildClientPetsSummary, {
    server: BuildClientPetsSummaryHandler,
  }),
  createActionHandler(buildEmployeeOptions, {
    server: BuildEmployeeOptionsHandler,
  }),
  createActionHandler(buildSelectedAdditionals, {
    server: BuildSelectedAdditionalsHandler,
  }),
  createActionHandler(buildServiceOptions, {
    server: BuildServiceOptionsHandler,
  }),
  createActionHandler(showGuidanceOptions, {
    server: ShowGuidanceOptionsHandler,
  }),
  createActionHandler(showSendingInfoItems, {
    server: ShowSendingInfoItemsHandler,
  }),
  createActionHandler(parseSelectedFluxInfoCollectionMenus, {
    server: ParseSelectedFluxInfoCollectionMenusHandler,
  }),
  createActionHandler(parseSelectedFluxSettings, {
    server: ParseSelectedFluxSettingsHandler,
  }),
  createActionHandler(verifyAvailableTimesOptionSelected, {
    server: VerifyAvailableTimesOptionSelectedHandler,
  }),
  createActionHandler(verifyBookingGuard, {
    server: VerifyBookingGuardHandler,
  }),
  createActionHandler(verifyInitialMessageToTrigger, {
    server: VerifyInitialMessageToTriggerHandler,
  }),
  createActionHandler(verifyInputedCpfText, {
    server: VerifyInputedCpfTextHandler,
  }),
  createActionHandler(verifyInputedDateText, {
    server: VerifyInputedDateTextHandler,
  }),
  createActionHandler(verifySimilarBreedOptionSelected, {
    server: VerifySimilarBreedOptionSelectedHandler,
  }),
  createActionHandler(validateTakeAndBringMinAdvanceHours, {
    server: ValidateTakeAndBringMinAdvanceHoursHandler,
  }),
];
