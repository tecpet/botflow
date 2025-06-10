import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";

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
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const categories = await tecpetSdk.service.listPricing(options.petId, options.segmentType, options?.shopId);
        if (categories) {
          if (options.categoriesAndServices) {
            variables.set([{id: options.categoriesAndServices, value: categories}]);
          }
        }
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
