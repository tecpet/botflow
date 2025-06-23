import {option} from "@typebot.io/forge";
import type {AuthDefinition} from "@typebot.io/forge/types";
import {tecpetAiDefaultBaseUrl} from "./constants";

export const auth = {
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
  }),
} satisfies AuthDefinition;
