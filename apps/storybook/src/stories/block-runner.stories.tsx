import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../block-runner/src/App.tsx";
import { GAME_ID } from "../../../block-runner/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../block-runner/src/mount-game.tsx";
import { GAME_CSS } from "../../../block-runner/src/styles.ts";

export default { title: "block-runner" };

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
