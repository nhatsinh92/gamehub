import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../snake-hunt/src/App.tsx";
import { GAME_ID } from "../../../snake-hunt/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../snake-hunt/src/mount-game.tsx";
import { GAME_CSS } from "../../../snake-hunt/src/styles.ts";

export default { title: "snake-hunt" };

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
