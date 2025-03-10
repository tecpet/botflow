import {createAction, option} from "@typebot.io/forge";
import {auth} from "../auth";
import got from "ky";
import {defaultBaseUrl, baseOptions} from "../constants";

export const getClient = createAction({
  auth,
  baseOptions,
  name: "Create Record",
  options: option.object({
    inputTest: option.string.layout({
      label: "Input teste",
      isRequired: true,
      helperText: "Identifier of the table to create records in.",
    }),
    variableIdToSave: option.string.layout({
      label: "Save audio URL in variable",
      placeholder: "Select a variable",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({variableIdToSave}) =>
    variableIdToSave ? [variableIdToSave] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        logs.add({
          status: 'success',
          description: 'Começando',
        });
        const baseUrl = options.baseUrl ?? defaultBaseUrl;
        const response = await got
          .get(baseUrl, {
            headers: {
              "xi-api-key": credentials.apiKey,
            },
            // json: {
            //   model_id: options.modelId,
            //   text: options.text,
            // },
            // timeout: false,
          })
          .text();
        if (options.variableIdToSave){
          variables.set([{id: options.variableIdToSave, value: `${options.inputTest} - ${response}`}]);
        }
      } catch (error) {
        logs.add({
          status: 'error',
          description: JSON.stringify(error),
        });
      }
    },
  },
});
