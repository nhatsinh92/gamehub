import { LocalAdapter } from "@repo/game-core";
import { GAME_ID } from "./game-name.ts";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, mountGame } from "./mount-game.tsx";

const container = document.getElementById("app");
if (container) {
  document.title = GAME_ID;
  mountGame(container, {
    gameId: GAME_ID,
    adapter: LocalAdapter,
    httpConfig: { baseUrl: "", getAccessTokenFunc: () => "" },
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
}
