import type { PaEditPetInput } from "@tec.pet/tecpet-sdk";
import {
  type BillingItemType,
  type GenderType,
  type PaPetResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { format, parse } from "date-fns";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const editPet = createAction({
  auth,
  baseOptions,
  name: "Editar um pet",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.number.layout({
      label: "Id do pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    petHair: option.string.layout({
      label: "Pelo do pet",
      isRequired: true,
      helperText: "Pelo do pet",
    }),
    petSize: option.string.layout({
      label: "Porte do pet",
      isRequired: true,
      helperText: "Porte do cliente",
    }),
    petWeight: option.string.layout({
      label: "Peso do pet",
      isRequired: true,
      helperText: "Nome do pet",
    }),
    petGender: option.string.layout({
      label: "Genero do pet",
      isRequired: true,
      helperText: "Genero do cliente",
    }),
    petBirthDate: option.string.layout({
      label: "Nascimento do pet",
      isRequired: true,
      helperText: "Nascimento do pet",
    }),
    editedPetWeight: option.string.layout({
      label: "Peso do pet editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedPetGender: option.string.layout({
      label: "Genero do pet editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedPetBirthDate: option.string.layout({
      label: "Nascimento do pet editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedPetHair: option.string.layout({
      label: "Pelo do pet editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedPetSize: option.string.layout({
      label: "Porte do pet editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    editedPetBirthDate,
    editedPetGender,
    editedPetHair,
    editedPetSize,
    editedPetWeight,
  }) => {
    const variables = [];

    if (editedPetBirthDate) variables.push(editedPetBirthDate);
    if (editedPetGender) variables.push(editedPetGender);
    if (editedPetHair) variables.push(editedPetHair);
    if (editedPetSize) variables.push(editedPetSize);
    if (editedPetWeight) variables.push(editedPetWeight);

    return variables;
  },
});
export const EditPetHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const body: PaEditPetInput = {
          weigth: Number(options.petWeight),
          genre: options.petGender as GenderType,
          hair: options.petHair as BillingItemType,
          size: options.petSize as BillingItemType,
        };

        if (options.petBirthDate) {
          const parsedBirthDate = parse(
            options.petBirthDate as string,
            "dd/MM/yyyy",
            new Date(),
          );
          body.birthDate = format(parsedBirthDate, "yyyy-MM-dd");
        }

        const editedPet: PaPetResponse = (await tecpetSdk.pet.edit(
          Number(options.petId),
          body,
        )) as PaPetResponse;

        if (editedPet) {
          variables.set([
            { id: options.editedPetWeight as string, value: editedPet.weigth },
          ]);
          variables.set([
            { id: options.editedPetGender as string, value: editedPet.genre },
          ]);
          variables.set([
            {
              id: options.editedPetBirthDate as string,
              value: editedPet.birthDate,
            },
          ]);
          variables.set([
            { id: options.editedPetSize as string, value: editedPet.size },
          ]);
          variables.set([
            { id: options.editedPetHair as string, value: editedPet.hair },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
};
