import {parseBlockCredentials, parseBlockSchema} from "@typebot.io/forge";
import {tecpetAiBlock} from ".";
import {auth} from "./auth";

export const tecpetAiBlockSchema = parseBlockSchema(tecpetAiBlock);
export const tecpetAiCredentialsSchema = parseBlockCredentials(
  tecpetAiBlock.id,
  auth.schema,
);
