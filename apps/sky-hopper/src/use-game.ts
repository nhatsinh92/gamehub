import { useGameContext } from "@repo/game-core";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import { bestScore } from "./best-score.ts";
import { CONFIG } from "./game/config.ts";
import { canvasBitmapSize } from "./game/canvas-size.ts";
import { draw } from "./game/draw.ts";
import { createState, step } from "./game/logic.ts";
import type { GameState, Phase } from "./game/logic.ts";
import { createRandom } from "./game/random.ts";
import { useGameLoop } from "./use-game-loop.ts";

interface View {
  phase: Phase;
  score: number;
}

/** Game state, the frame loop, the round end (submit, tracking) and replay. */
export function useGame(
  enabled: boolean,
  canvas: RefObject<HTMLCanvasElement | null>,
) {
  const ctx = useGameContext();
  const { sendTracking, submitResult, resetResult } = ctx;
  const stateRef = useRef<GameState>(createState(CONFIG));
  const randomRef = useRef(createRandom(Date.now()));
  const flapRef = useRef(false);
  const [view, setView] = useState<View>({ phase: "ready", score: 0 });
  const [best, setBest] = useState(0);
  const [failed, setFailed] = useState(false);

  const finish = (score: number): void => {
    sendTracking({ name: "game_over", params: { score } });
    setBest((b) => bestScore(b, score));
    void submitResult(score).then((result) => {
      if (!result) setFailed(true);
    });
  };

  const onSteps = (steps: number): void => {
    let state = stateRef.current;
    for (let i = 0; i < steps; i++) {
      const next = step(state, flapRef.current, CONFIG, randomRef.current);
      flapRef.current = false;
      if (state.phase === "ready" && next.phase !== "ready") {
        sendTracking({ name: "game_start" });
      }
      if (state.phase !== "over" && next.phase === "over") finish(next.score);
      state = next;
    }
    stateRef.current = state;
    setView((v) =>
      v.phase === state.phase && v.score === state.score
        ? v
        : { phase: state.phase, score: state.score },
    );
    const context = canvas.current?.getContext("2d");
    if (context) draw(context, state, CONFIG, canvasBitmapSize(window.devicePixelRatio, CONFIG).scale);
  };

  useGameLoop(enabled, onSteps);

  const onFlap = (): void => {
    if (stateRef.current.phase !== "over") flapRef.current = true;
  };

  const playAgain = (): void => {
    resetResult();
    stateRef.current = createState(CONFIG);
    randomRef.current = createRandom(Date.now());
    flapRef.current = false;
    setFailed(false);
    setView({ phase: "ready", score: 0 });
  };

  return { ctx, view, best, failed, onFlap, playAgain };
}
