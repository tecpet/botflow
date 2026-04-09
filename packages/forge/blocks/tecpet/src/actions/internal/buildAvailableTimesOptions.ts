import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";

export const buildAvailableTimesOptions = createAction({
  baseOptions,
  name: "Construir opções de horarios diposniveis",
  options: option.object({
    availableTimes: option.string.layout({
      label: "Horários disponiveis",
      isRequired: true,
      helperText: "Horários disponiveis para hoje e amanhã",
    }),
    timeSelectionBehaviorBehavior: option.string.layout({
      label: "Comportamento do seletor de horários - Comportamento",
      isRequired: true,
      helperText: "Comportamento",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Comportamento do seletor de horários - Modo exibição",
      isRequired: true,
      helperText: "Modo de exibição. Exemplo: de 30 em 30 min",
    }),
    availableTimesValues: option.string.layout({
      label: "Array de horarios disponiveis ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    availableTimesStartAndStop: option.string.layout({
      label: "Array de horarios disponiveis inicio e fim",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    availableTimesDates: option.string.layout({
      label: "Array de horarios disponiveis datas",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    availableTimesValues,
    availableTimesStartAndStop,
    availableTimesDates,
  }) => {
    const variables: Array<string> = [];

    if (availableTimesValues) variables.push(availableTimesValues);

    if (availableTimesStartAndStop) variables.push(availableTimesStartAndStop);

    if (availableTimesDates) variables.push(availableTimesDates);

    return variables;
  },
});

const formatDateBR = (dateBR: string): string => {
  const parts = dateBR.split("/");
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return dateBR;
};

export const BuildAvailableTimesOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const availableTimesRaw: string[] = options.availableTimes
      ? (JSON.parse(options.availableTimes as string) ?? [])
      : [];

    const availableTimes: Array<
      PaGetAvailableTimesResponse & AvailableTimeType
    > = availableTimesRaw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    );

    availableTimes.push({
      id: "OTHER",
      scheduleStartTime: "PREFIRO OUTRA DATA",
      dateBR: "",
      start: "",
      dateISO: "",
      stop: "",
    });

    variables.set([
      {
        id: options.availableTimesValues as string,
        value: availableTimes.map((t) => t),
      },
      {
        id: options.availableTimesStartAndStop as string,
        value: availableTimes.map((t) =>
          t.id !== "OTHER"
            ? "Dia " + formatDateBR(t.dateBR) + " ás " + t.scheduleStartTime
            : t.scheduleStartTime,
        ),
      },
      {
        id: options.availableTimesDates as string,
        value: availableTimes.map((t) => formatDateBR(t.dateBR)),
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
