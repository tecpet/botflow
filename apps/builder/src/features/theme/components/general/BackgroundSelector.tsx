import { useTranslate } from "@tolgee/react";
import {
  BackgroundType,
  defaultBackgroundType,
} from "@typebot.io/theme/constants";
import type { Background } from "@typebot.io/theme/schemas";
import { Label } from "@typebot.io/ui/components/Label";
import { Radio, RadioGroup } from "@typebot.io/ui/components/RadioGroup";
import { useRef } from "react";
import { BackgroundContent } from "./BackgroundContent";

type Props = {
  background?: Background;
  onBackgroundChange: (newBackground: Background) => void;
};

export const BackgroundSelector = ({
  background,
  onBackgroundChange,
}: Props) => {
  const { t } = useTranslate();
  // Remembers the last content used for each background type so switching type
  // back and forth (e.g. color → image → color) restores the previously
  // uploaded image / picked color instead of discarding it.
  const contentByTypeRef = useRef<Partial<Record<BackgroundType, string>>>({});

  const currentType = background?.type ?? defaultBackgroundType;
  if (background?.content !== undefined)
    contentByTypeRef.current[currentType] = background.content;

  const handleBackgroundTypeChange = (type: BackgroundType) =>
    onBackgroundChange({
      ...background,
      type,
      content: contentByTypeRef.current[type],
    });

  const handleBackgroundContentChange = (content: string) => {
    contentByTypeRef.current[currentType] = content;
    onBackgroundChange({ ...background, content });
  };

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup
        value={background?.type ?? defaultBackgroundType}
        onValueChange={(value) =>
          handleBackgroundTypeChange(value as BackgroundType)
        }
      >
        <Label className="hover:bg-gray-2/50 rounded-md p-2 border flex-1 flex justify-center">
          <Radio value={BackgroundType.COLOR} className="hidden" />
          {t("theme.sideMenu.global.background.color.select")}
        </Label>
        <Label className="hover:bg-gray-2/50 rounded-md p-2 border flex-1 flex justify-center">
          <Radio value={BackgroundType.IMAGE} className="hidden" />
          {t("theme.sideMenu.global.background.image.select")}
        </Label>
        <Label className="hover:bg-gray-2/50 rounded-md p-2 border flex-1 flex justify-center">
          <Radio value={BackgroundType.NONE} className="hidden" />
          {t("theme.sideMenu.global.background.none.select")}
        </Label>
      </RadioGroup>
      <BackgroundContent
        background={background}
        onBackgroundContentChange={handleBackgroundContentChange}
      />
    </div>
  );
};
