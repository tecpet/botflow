import { SwitchWithLabel } from "@/components/inputs/SwitchWithLabel";
import { VariableSearchInput } from "@/components/inputs/VariableSearchInput";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/queryClient";
import { Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { defaultTypebotLinkOptions } from "@typebot.io/blocks-logic/typebotLink/constants";
import type { TypebotLinkBlock } from "@typebot.io/blocks-logic/typebotLink/schema";
import { isNotEmpty } from "@typebot.io/lib/utils";
import { GroupsDropdown } from "./GroupsDropdown";
import { TypebotsDropdown } from "./TypebotsDropdown";

type Props = {
  options: TypebotLinkBlock["options"];
  onOptionsChange: (options: TypebotLinkBlock["options"]) => void;
};

export const TypebotLinkForm = ({ options, onOptionsChange }: Props) => {
  const { typebot } = useTypebot();

  const handleTypebotIdChange = async (
    typebotId: string | "current" | undefined,
  ) => onOptionsChange({ ...options, typebotId, groupId: undefined });

  const { data: linkedTypebotData } = useQuery(
    trpc.typebot.getTypebot.queryOptions(
      {
        typebotId: options?.typebotId as string,
      },
      {
        enabled:
          isNotEmpty(options?.typebotId) && options?.typebotId !== "current",
      },
    ),
  );

  const handleGroupIdChange = (groupId: string | undefined) =>
    onOptionsChange({ ...options, groupId });

  const updateMergeResults = (mergeResults: boolean) =>
    onOptionsChange({ ...options, mergeResults });

  const updateVariableId = (id?: string) => {
    if (id) {
      onOptionsChange({ ...options, variableId: id });
    }
  }

  const updateFluxByVariable = (fluxByVariable: boolean) =>
    onOptionsChange({
      ...options,
      fluxByVariable,
      groupId: undefined,
      typebotId: undefined,
      variableId: undefined,
    });

  const isCurrentTypebotSelected =
    (typebot && options?.typebotId === typebot.id) ||
    options?.typebotId === "current";

  return (
    <Stack>
      <SwitchWithLabel
        label="Definir fluxo por variável"
        moreInfoContent=""
        initialValue={
          options?.fluxByVariable ?? defaultTypebotLinkOptions.fluxByVariable
        }
        onCheckChange={updateFluxByVariable}
      />
      {options?.fluxByVariable && (
        <Stack>
          <VariableSearchInput
            initialVariableId={options?.variableId}
            onSelectVariable={(v) => updateVariableId(v?.id)}
          />
        </Stack>
      )}
      {!options?.fluxByVariable && typebot && (
        <TypebotsDropdown
          idsToExclude={[typebot.id]}
          typebotId={options?.typebotId}
          onSelect={handleTypebotIdChange}
          currentWorkspaceId={typebot.workspaceId as string}
        />
      )}
      {!options?.fluxByVariable && options?.typebotId && (
        <GroupsDropdown
          key={options.typebotId}
          groups={
            typebot && isCurrentTypebotSelected
              ? typebot.groups
              : (linkedTypebotData?.typebot?.groups ?? [])
          }
          groupId={options.groupId}
          onChange={handleGroupIdChange}
          isLoading={
            linkedTypebotData?.typebot === undefined &&
            options.typebotId !== "current" &&
            typebot &&
            typebot.id !== options.typebotId
          }
        />
      )}
      {!isCurrentTypebotSelected && (
        <SwitchWithLabel
          label="Merge answers"
          moreInfoContent="If enabled, the answers collected in the linked typebot will be merged with the results of the current typebot."
          initialValue={
            options?.mergeResults ?? defaultTypebotLinkOptions.mergeResults
          }
          onCheckChange={updateMergeResults}
        />
      )}
    </Stack>
  );
};
