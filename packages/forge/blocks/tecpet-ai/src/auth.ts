import { createAuth, option } from "@typebot.io/forge";
import {
  tecpetAiDefaultBaseUrl,
  tecpetPublicApiDefaultBaseUrl,
} from "./constants";

export const auth = createAuth({
  type: "encryptedCredentials",
  name: "tecpet-ai account",
  schema: option.object({
    baseUrl: option.string
      .layout({
        label: "Base URL",
        isRequired: true,
        helperText: "Change it only if you are self-hosting.",
        withVariableButton: false,
        defaultValue: tecpetAiDefaultBaseUrl,
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
    publicApiBaseUrl: option.string
      .layout({
        label: "Public API base URL",
        helperText:
          "Same base URL as the tecpet block. Used to load the AI v2 settings.",
        withVariableButton: false,
        defaultValue: tecpetPublicApiDefaultBaseUrl,
      })
      .transform((value) => value?.replace(/\/$/, "")),
    publicApiKey: option.string.layout({
      label: "Public API key",
      inputType: "password",
      helperText:
        "Same API key as the tecpet block. Without it, shops on the AI v2 run without their settings.",
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
  }),
});
