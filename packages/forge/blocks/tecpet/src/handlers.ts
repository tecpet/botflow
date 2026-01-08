import { createActionHandler } from "@typebot.io/forge";
import { getAvailableTimes } from "./actions/api/availableTimes/getAvailableTimes";
import { GetAvailableTimesHandler } from "./actions/api/availableTimes/getAvailableTimes";
import { getRescheduleAvailableTimes } from "./actions/api/availableTimes/getRescheduleAvailableTimes";
import { GetRescheduleAvailableTimesHandler } from "./actions/api/availableTimes/getRescheduleAvailableTimes";
import { getBillingMethods } from "./actions/api/billingMethod/getBillingMethods";
import { GetBillingMethodsHandler } from "./actions/api/billingMethod/getBillingMethods";
import { cancelBooking } from "./actions/api/booking/cancelBooking";
import { CancelBookingHandler } from "./actions/api/booking/cancelBooking";
import { createBooking } from "./actions/api/booking/createBooking";
import { CreateBookingHandler } from "./actions/api/booking/createBooking";
import { rescheduleBooking } from "./actions/api/booking/rescheduleBooking";
import { RescheduleBookingHandler } from "./actions/api/booking/rescheduleBooking";
import { getBreeds } from "./actions/api/breed/getBreeds";
import { GetBreedsHandler } from "./actions/api/breed/getBreeds";
import { getConfigurations } from "./actions/api/chatbotSettings/getConfigurations";
import { GetConfigurationsHandler } from "./actions/api/chatbotSettings/getConfigurations";
import { getFormattedMessages } from "./actions/api/chatbotSettings/getFormattedMessages";
import { GetFormattedMessagesHandler } from "./actions/api/chatbotSettings/getFormattedMessages";
import { editClient } from "./actions/api/client/editClient";
import { EditClientHandler } from "./actions/api/client/editClient";
import { getClient } from "./actions/api/client/getClient";
import { GetClientHandler } from "./actions/api/client/getClient";
import { getClientSummary } from "./actions/api/client/getClientSummary";
import { getClientSummaryHandler } from "./actions/api/client/getClientSummary";
import { getCombos } from "./actions/api/combo/getCombos";
import { GetCombosHandler } from "./actions/api/combo/getCombos";
import { getEmployess } from "./actions/api/employee/getEmployees";
import { GetEmployessHandler } from "./actions/api/employee/getEmployees";
import { createPet } from "./actions/api/pet/createPet";
import { CreatePetHandler } from "./actions/api/pet/createPet";
import { editPet } from "./actions/api/pet/editPet";
import { EditPetHandler } from "./actions/api/pet/editPet";
import { getPets } from "./actions/api/pet/getPets";
import { GetPetsHandler } from "./actions/api/pet/getPets";
import { getCategoriesAndServices } from "./actions/api/service/getCategoriesAndServices";
import { GetCategoriesAndServicesHandler } from "./actions/api/service/getCategoriesAndServices";
import { getShopConfigurations } from "./actions/api/shop/getShopConfigurations";
import { GetShopConfigurationsHandler } from "./actions/api/shop/getShopConfigurations";
import { getSpecies } from "./actions/api/specie/getSpecies";
import { GetSpeciesHandler } from "./actions/api/specie/getSpecies";
import { extractToken } from "./actions/api/token/extractToken";
import { ExtractTokenHandler } from "./actions/api/token/extractToken";
import { buildAvailableTimesOptions } from "./actions/internal/buildAvailableTimesOptions";
import { BuildAvailableTimesOptionsHandler } from "./actions/internal/buildAvailableTimesOptions";
import { buildClientBookingsSummary } from "./actions/internal/buildClientBookingsSummary";
import { BuildClientBookingsSummaryHandler } from "./actions/internal/buildClientBookingsSummary";
import { buildClientPetsSummary } from "./actions/internal/buildClientPetsSummary";
import { BuildClientPetsSummaryHandler } from "./actions/internal/buildClientPetsSummary";
import { buildEmployeeOptions } from "./actions/internal/buildEmployeeOptions";
import { BuildEmployeeOptionsHandler } from "./actions/internal/buildEmployeeOptions";
import { buildSelectedAdditionals } from "./actions/internal/buildSelectedAdditionals";
import { BuildSelectedAdditionalsHandler } from "./actions/internal/buildSelectedAdditionals";
import { buildServiceOptions } from "./actions/internal/buildServiceOptions";
import { BuildServiceOptionsHandler } from "./actions/internal/buildServiceOptions";
import { showGuidanceOptions } from "./actions/internal/showGuidanceOptions";
import { ShowGuidanceOptionsHandler } from "./actions/internal/showGuidanceOptions";
import { showSendingInfoItems } from "./actions/internal/showSendingInfoItems";
import { ShowSendingInfoItemsHandler } from "./actions/internal/showSendingInfoItems";
import { parseSelectedFluxInfoCollectionMenus } from "./actions/parser/selectedFlux.chatbotAction";
import { ParseSelectedFluxInfoCollectionMenusHandler } from "./actions/parser/selectedFlux.chatbotAction";
import { parseSelectedFluxSettings } from "./actions/parser/selectedFlux.settings";
import { ParseSelectedFluxSettingsHandler } from "./actions/parser/selectedFlux.settings";
import { verifyAvailableTimesOptionSelected } from "./actions/validations/veirifyAvailableTimesOptionSelected";
import { VerifyAvailableTimesOptionSelectedHandler } from "./actions/validations/veirifyAvailableTimesOptionSelected";
import { verifyBookingGuard } from "./actions/validations/verifyBookingGuard";
import { VerifyBookingGuardHandler } from "./actions/validations/verifyBookingGuard";
import { verifyInitialMessageToTrigger } from "./actions/validations/verifyInitialMessageToTrigger";
import { VerifyInitialMessageToTriggerHandler } from "./actions/validations/verifyInitialMessageToTrigger";
import { verifyInputedCpfText } from "./actions/validations/verifyInputedCpf";
import { VerifyInputedCpfTextHandler } from "./actions/validations/verifyInputedCpf";
import { verifyInputedDateText } from "./actions/validations/verifyInputedDateText";
import { VerifyInputedDateTextHandler } from "./actions/validations/verifyInputedDateText";
import { verifySimilarBreedOptionSelected } from "./actions/validations/verifySimilarBreedOptionSelected";
import { VerifySimilarBreedOptionSelectedHandler } from "./actions/validations/verifySimilarBreedOptionSelected";

export default [
  createActionHandler(getAvailableTimes, { server: GetAvailableTimesHandler }),
  createActionHandler(getRescheduleAvailableTimes, { server: GetRescheduleAvailableTimesHandler }),
  createActionHandler(getBillingMethods, { server: GetBillingMethodsHandler }),
  createActionHandler(cancelBooking, { server: CancelBookingHandler }),
  createActionHandler(createBooking, { server: CreateBookingHandler }),
  createActionHandler(rescheduleBooking, { server: RescheduleBookingHandler }),
  createActionHandler(getBreeds, { server: GetBreedsHandler }),
  createActionHandler(getConfigurations, { server: GetConfigurationsHandler }),
  createActionHandler(getFormattedMessages, { server: GetFormattedMessagesHandler }),
  createActionHandler(editClient, { server: EditClientHandler }),
  createActionHandler(getClient, { server: GetClientHandler }),
  createActionHandler(getClientSummary, { server: getClientSummaryHandler }),
  createActionHandler(getCombos, { server: GetCombosHandler }),
  createActionHandler(getEmployess, { server: GetEmployessHandler }),
  createActionHandler(createPet, { server: CreatePetHandler }),
  createActionHandler(editPet, { server: EditPetHandler }),
  createActionHandler(getPets, { server: GetPetsHandler }),
  createActionHandler(getCategoriesAndServices, { server: GetCategoriesAndServicesHandler }),
  createActionHandler(getShopConfigurations, { server: GetShopConfigurationsHandler }),
  createActionHandler(getSpecies, { server: GetSpeciesHandler }),
  createActionHandler(extractToken, { server: ExtractTokenHandler }),
  createActionHandler(buildAvailableTimesOptions, { server: BuildAvailableTimesOptionsHandler }),
  createActionHandler(buildClientBookingsSummary, { server: BuildClientBookingsSummaryHandler }),
  createActionHandler(buildClientPetsSummary, { server: BuildClientPetsSummaryHandler }),
  createActionHandler(buildEmployeeOptions, { server: BuildEmployeeOptionsHandler }),
  createActionHandler(buildSelectedAdditionals, { server: BuildSelectedAdditionalsHandler }),
  createActionHandler(buildServiceOptions, { server: BuildServiceOptionsHandler }),
  createActionHandler(showGuidanceOptions, { server: ShowGuidanceOptionsHandler }),
  createActionHandler(showSendingInfoItems, { server: ShowSendingInfoItemsHandler }),
  createActionHandler(parseSelectedFluxInfoCollectionMenus, { server: ParseSelectedFluxInfoCollectionMenusHandler }),
  createActionHandler(parseSelectedFluxSettings, { server: ParseSelectedFluxSettingsHandler }),
  createActionHandler(verifyAvailableTimesOptionSelected, { server: VerifyAvailableTimesOptionSelectedHandler }),
  createActionHandler(verifyBookingGuard, { server: VerifyBookingGuardHandler }),
  createActionHandler(verifyInitialMessageToTrigger, { server: VerifyInitialMessageToTriggerHandler }),
  createActionHandler(verifyInputedCpfText, { server: VerifyInputedCpfTextHandler }),
  createActionHandler(verifyInputedDateText, { server: VerifyInputedDateTextHandler }),
  createActionHandler(verifySimilarBreedOptionSelected, { server: VerifySimilarBreedOptionSelectedHandler }),
];
