import { Tag, Text } from "@chakra-ui/react";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/queryClient";
import { Tag, Text, Wrap } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import type { TypebotLinkBlock } from "@typebot.io/blocks-logic/typebotLink/schema";
import { byId, isNotEmpty } from "@typebot.io/lib/utils";
import { isSingleVariable } from "@typebot.io/variables/isSingleVariable";
import { useMemo } from "react";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/queryClient";

type Props = {
  block: TypebotLinkBlock;
};

export const TypebotLinkNode = ({ block }: Props) => {
  const { typebot } = useTypebot();

  const { data: linkedTypebotData } = useQuery(
    trpc.typebot.getTypebot.queryOptions(
      {
        typebotId: block.options?.typebotId as string,
      },
      {
        enabled:
          isNotEmpty(block.options?.typebotId) &&
          block.options?.typebotId !== "current",
      },
    ),
  );

  const isCurrentTypebot =
    typebot &&
    (block.options?.typebotId === typebot.id ||
      block.options?.typebotId === "current");
  const linkedTypebot = isCurrentTypebot ? typebot : linkedTypebotData?.typebot;

  const groupTitle = useMemo(() => {
    if (!block.options?.groupId) return;
    if (isSingleVariable(block.options.groupId)) return block.options.groupId;
    return linkedTypebot?.groups.find(byId(block.options.groupId))?.title;
  }, [block.options?.groupId, linkedTypebot?.groups]);

  const dynamicVariableName = typebot?.variables.find(
    (variable) => variable.id === block.options?.variableId,
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
      </Text>
    );

  if (!groupTitle && !block.options?.fluxByVariable)
    return <Text color="gray.500">Configure...</Text>;

  return (
    <Text>
      Ir para{" "}
      {groupTitle ? (
        <>
          to <Tag colorScheme="purple">{groupTitle}</Tag>
        </>
      ) : null}{" "}
      {!isCurrentTypebot ? (
        <>
          in <Tag>{linkedTypebot?.name}</Tag>
        </>
      ) : null}
    </Text>
  );
};
