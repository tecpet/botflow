import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import { auth } from "../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../constants";

export const getPets = createAction({
  auth,
  baseOptions,
  name: "Buscar Pets do Cliente",
  options: option.object({
    clientId: option.string.layout({
      label: "Cliente",
      isRequired: true,
      helperText: "Id do cliente",
    }),
    pets: option.string.layout({
      label: "Pets",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ pets }) => (pets ? [pets] : []),
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const pets = await tecpetSdk.pet.getByClient(options?.clientId ?? "");
        if (pets) {
          if (options.pets) {
            variables.set([{ id: options.pets, value: pets }]);
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
