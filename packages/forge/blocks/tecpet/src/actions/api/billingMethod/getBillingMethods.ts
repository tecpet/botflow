import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

export const getBillingMethods = createAction({
  auth,
  baseOptions,
  name: "Buscar Portes e Pelos da Loja",
  options: option.object({
    shopId: option.string.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    displayMode: option.string.layout({
      label: "Modo de visualização do Porte",
      isRequired: true,
      helperText: "Modo Porte",
    }),
    sizes: option.string.layout({
      label: "Portes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    sizesNames: option.string.layout({
      label: "Portes Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    sizesTags: option.string.layout({
      label: "Portes Tags",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    hairs: option.string.layout({
      label: "Pelos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    hairsNames: option.string.layout({
      label: "Pelos Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    hairsTags: option.string.layout({
      label: "Pelos Tags",
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
        const billingMethods = await tecpetSdk.billingMethod.list(options?.segmentType, options?.shopId);
        if (billingMethods) {
          const sizeMethod = billingMethods.find(m => m.tag === "SIZE");
          if (options.sizes) {
            variables.set([{id: options.sizes, value: sizeMethod.billingItems}]);
          }
          if (options.sizesNames) {
            const sizesNames = [];
            switch (options.displayMode) {
              case "SIZE_NAME":
                sizesNames.push(...sizeMethod.billingItems.map(bi => bi.name));
                break;
              case "SIZE_WEIGHT":
                sizesNames.push(...sizeMethod.billingItems.map(bi => `De ${bi.min} a ${bi.max} kg`));
                break;
              case "SIZE_WEIGHT_AND_NAME":
                sizesNames.push(...sizeMethod.billingItems.map(bi => `${bi.name} - de ${bi.min} a ${bi.max} kg`));
                break;
              default:
                sizesNames.push(...sizeMethod.billingItems.map(bi => `${bi.name} - de ${bi.min} a ${bi.max} kg`));
                break;
            }
            variables.set([{id: options.sizesNames, value: sizesNames}]);
          }
          if (options.sizesTags) {
            variables.set([{id: options.sizesTags, value: sizeMethod.billingItems.map(bi => bi.tag)}]);
          }

          const hairMethod = billingMethods.find(m => m.tag === "HAIR");
          if (options.hairs) {
            variables.set([{id: options.sizes, value: hairMethod.billingItems}]);
          }
          if (options.hairsNames) {
            variables.set([{id: options.hairsNames, value: hairMethod.billingItems.map(bi => bi.name)}]);
          }
          if (options.hairsTags) {
            variables.set([{id: options.hairsTags, value: hairMethod.billingItems.map(bi => bi.tag)}]);
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
