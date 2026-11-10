import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../scratch-card-example/src/App.tsx";
import { GAME_ID } from "../../../scratch-card-example/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../scratch-card-example/src/mount-game.tsx";
import { GAME_CSS } from "../../../scratch-card-example/src/styles.ts";

export default { title: "scratch-card-example" };

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
