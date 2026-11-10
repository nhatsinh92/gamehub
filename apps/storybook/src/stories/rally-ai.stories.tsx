import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../rally-ai/src/App.tsx";
import { GAME_ID } from "../../../rally-ai/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../rally-ai/src/mount-game.tsx";
import { GAME_CSS } from "../../../rally-ai/src/styles.ts";

export default { title: "rally-ai" };

export const Default = {
  render: () => (
    <>
      <style>{GAME_CSS}</style>
      <App
        gameId={GAME_ID}
        adapter={LocalAdapter}
        httpConfig={{ baseUrl: "", getAccessTokenFunc: () => "" }}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
      />
    </>
  ),
};
