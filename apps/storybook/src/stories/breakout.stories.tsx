import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../breakout/src/App.tsx";
import { GAME_ID } from "../../../breakout/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../breakout/src/mount-game.tsx";
import { GAME_CSS } from "../../../breakout/src/styles.ts";

export default { title: "breakout" };

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
