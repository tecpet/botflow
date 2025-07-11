import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const editPet = createAction({
  auth,
  baseOptions,
  name: "Editar um pet",
  options: option.object({
    shopId: option.string.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.string.layout({
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
  getSetVariableIds: ({ pets }) => (pets ? [pets] : []),
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const body = {
          weight: options.petWeight ? Number(options.petWeight) : null,
          genre: options.petGender
            ? options.petGender === "Macho"
              ? "MALE"
              : "FEMALE"
            : null,
          birthDate: options.petBirthDate ? options.petBirthDate : null,
          hair: options.petHair ? options.petHair : null,
          size: options.petSize ? options.petSize : null,
        };
        const editedPet = await tecpetSdk.pet.edit(
          options.petId,
          body,
          options.shopId,
        );

        if (editedPet) {
          variables.set([
            { id: options.editedPetWeight, value: editedPet.weight },
          ]);
          variables.set([
            { id: options.editedPetGender, value: editedPet.genre },
          ]);
          variables.set([
            { id: options.editedPetBirthDate, value: editedPet.birthDate },
          ]);
          variables.set([{ id: options.editedPetSize, value: editedPet.size }]);
          variables.set([{ id: options.editedPetHair, value: editedPet.hair }]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
