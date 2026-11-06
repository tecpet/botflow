import { Standard } from "@typebot.io/react";
import {
  BackgroundType,
  defaultBackgroundColor,
} from "@typebot.io/theme/constants";
import type { Theme } from "@typebot.io/theme/schemas";
import type { CSSProperties } from "react";
import { Seo } from "@/components/Seo";
import { TypebotHeader } from "@/features/editor/components/TypebotHeader";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { ThemeSideMenu } from "./ThemeSideMenu";

export const ThemePage = () => {
  const { typebot } = useTypebot();

  return (
    <div className="flex overflow-hidden h-screen flex-col">
      <Seo title={typebot?.name ? `${typebot.name} | Theme` : "Theme"} />
      <TypebotHeader />
      <div className="flex items-center w-full gap-4 h-[calc(100vh-var(--header-height))]">
        <ThemeSideMenu />
        <div className="flex flex-1 h-[calc(100%-2rem)] w-full border rounded-xl mr-4 bg-gray-1">
          {typebot && (
            <Standard
              typebot={typebot}
              style={{
                borderRadius: "0.75rem",
                width: "100%",
                height: "100%",
                ...parseBackground(
                  typebot.theme.general?.background,
                  typebot.version,
                ),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const parseBackground = (
  background: NonNullable<Theme["general"]>["background"],
  version: keyof typeof defaultBackgroundColor,
): CSSProperties => {
  switch (background?.type) {
    case undefined:
    case BackgroundType.COLOR:
      return {
        backgroundColor: background?.content ?? defaultBackgroundColor[version],
      };
    case BackgroundType.IMAGE:
      return {
        backgroundImage: `url(${background.content})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    case BackgroundType.NONE:
      return {};
  }
};
