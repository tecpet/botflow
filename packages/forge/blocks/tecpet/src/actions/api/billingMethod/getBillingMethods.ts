import type { PaBillingResponse, ShopSegment } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getBillingMethods = createAction({
  auth,
  baseOptions,
  name: "Buscar Portes e Pelos da Loja",
  options: option.object({
    shopId: option.number.layout({
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
  getSetVariableIds: ({
    hairsTags,
    hairsNames,
    hairs,
    sizesTags,
    sizesNames,
    sizes,
  }) => {
    const variables = [];

    if (hairsTags) variables.push(hairsTags);
    if (hairsNames) variables.push(hairsNames);
    if (hairs) variables.push(hairs);
    if (sizesTags) variables.push(sizesTags);
    if (sizesNames) variables.push(sizesNames);
    if (sizes) variables.push(sizes);

    return variables;
  },
});
export const GetBillingMethodsHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );
        const billingMethods: PaBillingResponse[] | null =
          await tecpetSdk.billingMethod.list(
            options?.segmentType as ShopSegment,
            Number(options?.shopId),
          );
        if (billingMethods && billingMethods.length > 0) {
          const sizeMethod: PaBillingResponse = billingMethods.find(
            (m) => m.tag === "SIZE",
          ) as PaBillingResponse;
          variables.set([
            { id: options.sizes as string, value: sizeMethod.billingItems },
          ]);
          const sizesNames = [];
          switch (options.displayMode) {
            case "SIZE_NAME":
              sizesNames.push(...sizeMethod.billingItems.map((bi) => bi.name));
              break;
            case "SIZE_WEIGHT":
              sizesNames.push(
                ...sizeMethod.billingItems.map(
                  (bi) => `De ${bi.min} a ${bi.max} kg`,
                ),
              );
              break;
            case "SIZE_WEIGHT_AND_NAME":
              sizesNames.push(
                ...sizeMethod.billingItems.map(
                  (bi) => `${bi.name} - de ${bi.min} a ${bi.max} kg`,
                ),
              );
              break;
            default:
              sizesNames.push(
                ...sizeMethod.billingItems.map(
                  (bi) => `${bi.name} - de ${bi.min} a ${bi.max} kg`,
                ),
              );
              break;
          }
          variables.set([
            { id: options.sizesNames as string, value: sizesNames },
          ]);
          variables.set([
            {
              id: options.sizesTags as string,
              value: sizeMethod.billingItems.map((bi) => bi.tag),
            },
          ]);
          const hairMethod: PaBillingResponse = billingMethods.find(
            (m) => m.tag === "HAIR",
          ) as PaBillingResponse;

          variables.set([
            { id: options.sizes as string, value: hairMethod.billingItems },
          ]);
          variables.set([
            {
              id: options.hairsNames as string,
              value: hairMethod.billingItems.map((bi) => bi.name),
            },
          ]);
          variables.set([
            {
              id: options.hairsTags as string,
              value: hairMethod.billingItems.map((bi) => bi.tag),
            },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
};
