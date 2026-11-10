import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../memory-match/src/App.tsx";
import { GAME_ID } from "../../../memory-match/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../memory-match/src/mount-game.tsx";
import { GAME_CSS } from "../../../memory-match/src/styles.ts";

export default { title: "memory-match" };

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
