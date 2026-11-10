import { LocalAdapter } from "@repo/game-core";
import { GAME_ID } from "./game-name.ts";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, mountGame } from "./mount-game.tsx";

void [mountGame, LocalAdapter, GAME_ID, DEFAULT_WIDTH, DEFAULT_HEIGHT];
