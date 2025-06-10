import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";

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
    petsIds: option.string.layout({
      label: "Pets Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsNames: option.string.layout({
      label: "Pets Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsDescriptions: option.string.layout({
      label: "Pets Descrição",
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
        const pets = await tecpetSdk.pet.getByClient(options?.clientId ?? "");
        if (pets) {
          if (options.pets) {
            pets.push({ id: 'new', name: 'Cadastrar novo pet'});
            variables.set([{id: options.pets, value: pets}]);
          }
          if (options.petsIds) {
            const petsIds = pets.map(p => p.id);
            variables.set([{id: options.petsIds, value: petsIds}]);
          }
          if (options.petsNames) {
            const petsNames = pets.map(p => p.name);
            variables.set([{id: options.petsNames, value: petsNames}]);
          }
          if (options.petsDescriptions) {
            const petsDescriptions = pets.map(p => p.breedName ? p.breedName : '');
            variables.set([{id: options.petsDescriptions, value: petsDescriptions}]);
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
