import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../pad-memory/src/App.tsx";
import { GAME_ID } from "../../../pad-memory/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../pad-memory/src/mount-game.tsx";
import { GAME_CSS } from "../../../pad-memory/src/styles.ts";

export default { title: "pad-memory" };

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
