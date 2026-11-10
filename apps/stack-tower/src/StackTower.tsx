import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { H, W } from "./logic.ts";
import { useGame } from "./use-game.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  hint: "Tap or press Space to drop",
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

export function StackTower(props: { width: number; height: number }): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const ctx = useGameContext();
  const { view, failed, onDrop, playAgain } = useGame(
    Boolean(ctx.config) && !loadFailed,
    canvas,
  );
  const { initGame, sendTracking } = ctx;

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((loaded) => setLoadFailed(loaded === null));
    // once, on mount
  }, []);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== "Space" || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (!event.repeat) onDrop();
  };
  const shell = (children: ReactElement): ReactElement => (
    <div
      className="game"
      style={{ width: props.width, height: props.height }}
      tabIndex={0}
      ref={root}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );

  if (loadFailed) return shell(<div className="status">{TEXT.loadError}</div>);
  if (!ctx.config) return shell(<div className="status">{TEXT.loading}</div>);
  const done = ctx.result !== null || failed;
  return shell(
    <>
      <canvas
        ref={canvas}
        className="play"
        width={W}
        height={H}
        onPointerDown={(event) => {
          event.preventDefault();
          root.current?.focus();
          onDrop();
        }}
      />
      <Overlay view={view} done={done} result={ctx.result} onAgain={playAgain} />
    </>,
  );
}

function Overlay(props: {
  view: { phase: string; score: number };
  done: boolean;
  result: GameResult | null;
  onAgain: () => void;
}): ReactElement {
  const { view, done, result, onAgain } = props;
  if (view.phase !== "over") {
    return (
      <>
        {view.phase === "ready" && <div className="hint">{TEXT.hint}</div>}
        <div className="score">{view.score}</div>
      </>
    );
  }
  return (
    <div className="over">
      <div className="final-score">Score: {view.score}</div>
      {done && <Outcome result={result} />}
      {done && <button onClick={onAgain}>{TEXT.playAgain}</button>}
    </div>
  );
}
