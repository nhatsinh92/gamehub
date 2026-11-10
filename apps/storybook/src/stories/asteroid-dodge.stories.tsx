import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../asteroid-dodge/src/App.tsx";
import { GAME_ID } from "../../../asteroid-dodge/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../asteroid-dodge/src/mount-game.tsx";
import { GAME_CSS } from "../../../asteroid-dodge/src/styles.ts";

export default { title: "asteroid-dodge" };

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
