import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/trpc";
import {Tag, Text, Wrap} from "@chakra-ui/react";
import type { TypebotLinkBlock } from "@typebot.io/blocks-logic/typebotLink/schema";
import { byId, isNotEmpty } from "@typebot.io/lib/utils";
import React from "react";

type Props = {
  block: TypebotLinkBlock;
};

export const TypebotLinkNode = ({ block }: Props) => {
  const { typebot } = useTypebot();

  const { data: linkedTypebotData } = trpc.typebot.getTypebot.useQuery(
    {
      typebotId: block.options?.typebotId as string,
    },
    {
      enabled:
        isNotEmpty(block.options?.typebotId) &&
        block.options?.typebotId !== "current",
    },
  );

  const isCurrentTypebot =
    typebot &&
    (block.options?.typebotId === typebot.id ||
      block.options?.typebotId === "current");
  const linkedTypebot = isCurrentTypebot ? typebot : linkedTypebotData?.typebot;
  const blockTitle = linkedTypebot?.groups.find(
    byId(block.options?.groupId),
  )?.title;

  const dynamicVariableName = typebot?.variables.find(
    (variable) =>
      variable.id === block.options?.variableId,
  )?.name;

  if (!block.options?.variableId && block.options?.fluxByVariable)
    return <Text color="gray.500">Configure...</Text>;

  if (block.options?.variableId)
  return (
    <Text>
      Ir para{" "}
      {dynamicVariableName ? (
        <>
          <Wrap spacing={1}>
            <Tag bg="orange.400" color="white">
              {dynamicVariableName}
            </Tag>
          </Wrap>
        </>
      ) : (
        <></>
      )}
    </Text>);

  if (!blockTitle && !block.options?.fluxByVariable)
    return <Text color="gray.500">Configure...</Text>;

  return (
    <Text>
      Ir para{" "}
      {blockTitle ? (
        <>
          <Tag>{blockTitle}</Tag>
        </>
      ) : (
        <></>
      )}{" "}
      {!isCurrentTypebot ? (
        <>
          em <Tag colorScheme="orange">{linkedTypebot?.name}</Tag>
        </>
      ) : (
        <></>
      )}
    </Text>
  );
};
