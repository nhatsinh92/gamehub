import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { BOARD_H, BOARD_W } from "./game-logic.ts";
import { useGame } from "./use-game.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  hint: "Tap or press an arrow key to launch",
  playAgain: "Play again",
} as const;

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

export function Breakout(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking } = ctx;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const game = useGame(Boolean(ctx.config) && !loadFailed, canvas);
  const { score, launched, over, failed, start, dragTo, playAgain } = game;

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const done = ctx.result !== null || failed;
  return (
    <>
      <div className="score">{score}</div>
      <div className="board">
        <canvas
          className="play"
          width={BOARD_W}
          height={BOARD_H}
          ref={canvas}
          onPointerDown={(e) => {
            dragTo(e.clientX, e.currentTarget.getBoundingClientRect());
            start();
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) dragTo(e.clientX, e.currentTarget.getBoundingClientRect());
          }}
        />
        {!launched && !over && <div className="hint">{TEXT.hint}</div>}
        {over && (
          <div className="over">
            <div className="final-score">Score: {score}</div>
            {done && <Outcome result={ctx.result} />}
            {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
          </div>
        )}
      </div>
    </>
  );
}
