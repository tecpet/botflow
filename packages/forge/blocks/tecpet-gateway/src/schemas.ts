import { parseBlockCredentials, parseBlockSchema } from "@typebot.io/forge";
import { tecpetGatewayBlock } from ".";
import { auth } from "./auth";

export const tecpetGatewayBlockSchema = parseBlockSchema(tecpetGatewayBlock);
export const tecpetGatewayCredentialsSchema = parseBlockCredentials(
  tecpetGatewayBlock.id,
  auth,
);
