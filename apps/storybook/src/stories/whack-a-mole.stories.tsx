import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../whack-a-mole/src/App.tsx";
import { GAME_ID } from "../../../whack-a-mole/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../whack-a-mole/src/mount-game.tsx";
import { GAME_CSS } from "../../../whack-a-mole/src/styles.ts";

export default { title: "whack-a-mole" };

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
