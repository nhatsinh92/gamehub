import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../stack-tower/src/App.tsx";
import { GAME_ID } from "../../../stack-tower/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../stack-tower/src/mount-game.tsx";
import { GAME_CSS } from "../../../stack-tower/src/styles.ts";

export default { title: "stack-tower" };

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
