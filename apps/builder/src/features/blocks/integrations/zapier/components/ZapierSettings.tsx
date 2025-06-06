import { ExternalLinkIcon } from "@/components/icons";
import { Alert, AlertIcon, Button, Link, Stack, Text } from "@chakra-ui/react";
import type {
  HttpRequest,
  HttpRequestBlock,
} from "@typebot.io/blocks-integrations/httpRequest/schema";
import type { ZapierBlock } from "@typebot.io/blocks-integrations/zapier/schema";
import React, { useRef } from "react";
import { HttpRequestAdvancedConfigForm } from "../../httpRequest/components/HttpRequestAdvancedConfigForm";

type Props = {
  block: ZapierBlock;
  onOptionsChange: (options: HttpRequestBlock["options"]) => void;
};

export const ZapierSettings = ({
  block: { id: blockId, options },
  onOptionsChange,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const setLocalWebhook = async (newLocalWebhook: HttpRequest) => {
    onOptionsChange({
      ...options,
      webhook: newLocalWebhook,
    });
    return;
  };

  const url = options?.webhook?.url;

  const handleNewTestResponse = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  };

  return (
    <Stack spacing={0}>
      <Stack spacing={4}>
        <Alert status={url ? "success" : "info"} rounded="md">
          <AlertIcon />
          {url ? (
            <>Your zap is correctly configured 🚀</>
          ) : (
            <Stack>
              <Text>Head up to Zapier to configure this block:</Text>
              <Button
                as={Link}
                href="https://zapier.com/apps/typebot/integrations"
                isExternal
                colorScheme="orange"
              >
                <Text mr="2">Zapier</Text> <ExternalLinkIcon />
              </Button>
            </Stack>
          )}
        </Alert>
        <HttpRequestAdvancedConfigForm
          blockId={blockId}
          httpRequest={options?.webhook}
          options={options}
          onHttpRequestChange={setLocalWebhook}
          onOptionsChange={onOptionsChange}
          onNewTestResponse={handleNewTestResponse}
        />
      </Stack>
      <div ref={bottomRef} />
    </Stack>
  );
};
