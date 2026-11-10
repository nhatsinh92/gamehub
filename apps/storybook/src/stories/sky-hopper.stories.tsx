import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../sky-hopper/src/App.tsx";
import { GAME_ID } from "../../../sky-hopper/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../sky-hopper/src/mount-game.tsx";
import { GAME_CSS } from "../../../sky-hopper/src/styles.ts";

export default { title: "sky-hopper" };

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
