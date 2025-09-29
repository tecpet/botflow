import { createAuth, option } from "@typebot.io/forge";
import { tecpetDefaultBaseUrl } from "./constants";

export const auth = createAuth({
  type: "encryptedCredentials",
  name: "tecpet account",
  schema: option.object({
    baseUrl: option.string
      .layout({
        label: "Base URL",
        isRequired: true,
        helperText: "Change it only if you are self-hosting.",
        withVariableButton: false,
        defaultValue: tecpetDefaultBaseUrl,
      })
      .transform((value) => value?.replace(/\/$/, "")),
    apiKey: option.string.layout({
      label: "API key",
      isRequired: true,
      inputType: "password",
      helperText: "You can generate an API key [here](<INSERT_URL>).",
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
  }),
});
