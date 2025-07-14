import type { PaComboPricingResponse, ShopSegment } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getCombos = createAction({
  auth,
  baseOptions,
  name: "Buscar Combos com Preço da Loja",
  options: option.object({
    shopId: option.number.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.number.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    combos: option.string.layout({
      label: "Combos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    combosIds: option.string.layout({
      label: "Combos Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ combos, combosIds }) => {
    const variables = [];

    if (combos) variables.push(combos);
    if (combosIds) variables.push(combosIds);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const combos: PaComboPricingResponse[] = (await tecpetSdk.combo.pricing(
          Number(options.petId),
          options.segmentType as ShopSegment,
          Number(options?.shopId),
        )) as PaComboPricingResponse[];
        variables.set([{ id: options.combos as string, value: combos }]);
        variables.set([
          { id: options.combosIds as string, value: combos.map((c) => c.id) },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
