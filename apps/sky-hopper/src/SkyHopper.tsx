import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { GameCanvas } from "./GameCanvas.tsx";
import { useGame } from "./use-game.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  hint: "Tap or press Space to start",
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

export function SkyHopper(props: { width: number; height: number }): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const ctx = useGameContext();
  const { initGame, sendTracking } = ctx;
  const { view, best, failed, onFlap, playAgain } = useGame(
    Boolean(ctx.config) && !loadFailed,
    canvas,
  );

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((loaded) => setLoadFailed(loaded === null));
    // once, on mount
  }, []);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== "Space" || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (!event.repeat) onFlap();
  };
  const style = { width: props.width, height: props.height };
  const shell = (children: ReactElement): ReactElement => (
    <div className="game" style={style} tabIndex={0} ref={root} onKeyDown={onKeyDown}>
      {children}
    </div>
  );

  if (loadFailed) return shell(<div className="status">{TEXT.loadError}</div>);
  if (!ctx.config) return shell(<div className="status">{TEXT.loading}</div>);
  const done = ctx.result !== null || failed;
  return shell(
    <>
      <GameCanvas
        canvasRef={canvas}
        onPress={() => {
          root.current?.focus();
          onFlap();
        }}
      />
      {view.phase === "ready" && <div className="hint">{TEXT.hint}</div>}
      {view.phase !== "over" && <div className="score">{view.score}</div>}
      {view.phase === "over" && (
        <div className="over">
          <div className="final-score">Score: {view.score}</div>
          <div className="best-score">Best: {best}</div>
          {done && <Outcome result={ctx.result} />}
          {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
        </div>
      )}
    </>,
  );
}
