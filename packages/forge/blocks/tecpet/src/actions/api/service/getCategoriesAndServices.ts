import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

export const getCategoriesAndServices = createAction({
  auth,
  baseOptions,
  name: "Buscar serviçis com Preço da Loja",
  options: option.object({
    shopId: option.string.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.string.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    categoriesAndServices: option.string.layout({
      label: "Categorias e Serviços",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    servicesIds: option.string.layout({
      label: "Ids dos serviços",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const categories = await tecpetSdk.service.pricing(options.petId, options.segmentType, options?.shopId);
        if (categories && categories.length > 0) {
          const servicesIds = categories.flatMap(category =>
            category.services.map(service => service.id)
          );
          variables.set([{id: options.categoriesAndServices, value: categories}]);
          variables.set([{id: options.servicesIds, value: servicesIds}]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
