import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../cyber-alley-sniper/src/App.tsx";
import { GAME_ID } from "../../../cyber-alley-sniper/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../cyber-alley-sniper/src/mount-game.tsx";
import { GAME_CSS } from "../../../cyber-alley-sniper/src/styles.ts";

export default { title: "cyber-alley-sniper" };

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
