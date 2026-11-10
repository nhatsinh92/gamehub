import { LocalAdapter } from "@repo/game-core";
import { App } from "../../../catch-the-fruit/src/App.tsx";
import { GAME_ID } from "../../../catch-the-fruit/src/game-name.ts";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
} from "../../../catch-the-fruit/src/mount-game.tsx";
import { GAME_CSS } from "../../../catch-the-fruit/src/styles.ts";

export default { title: "catch-the-fruit" };

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
