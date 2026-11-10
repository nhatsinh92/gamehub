import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../slide-merge/src/App.tsx";
import { GAME_ID } from "../../../slide-merge/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../slide-merge/src/mount-game.tsx";
import { GAME_CSS } from "../../../slide-merge/src/styles.ts";

export default { title: "slide-merge" };

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
