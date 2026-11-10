import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { MoleCanvas, holeAt } from "./MoleCanvas.tsx";
import {
  ROUND_MS,
  advance,
  createState,
  isOver,
  whack,
} from "./mole-logic.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

const CANVAS_WIDTH = 328;
const CANVAS_HEIGHT = 380;
const TICK_MS = 33;

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function useRound() {
  const ctx = useGameContext();
  const [round, setRound] = useState(0);
  const [state, setState] = useState(createState);
  const [failed, setFailed] = useState(false);
  const live = useRef(state);
  const submitted = useRef(false);
  const { sendTracking, submitResult, resetResult } = ctx;
  const ready = ctx.config !== null;

  useEffect(() => {
    if (!ready) return;
    const start = Date.now();
    live.current = createState();
    setState(live.current);
    const timer = setInterval(() => {
      live.current = advance(live.current, Date.now() - start, Math.random);
      setState(live.current);
      if (!isOver(live.current)) return;
      clearInterval(timer);
      if (submitted.current) return;
      submitted.current = true;
      sendTracking({
        name: "game_over",
        params: { score: live.current.score },
      });
      void submitResult(live.current.score).then((result) => {
        if (result) {
          sendTracking({
            name: "game_result",
            params: { status: result.status, isWin: result.isWin },
          });
        } else setFailed(true);
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [ready, round]);

  const onWhack = (index: number | null): void => {
    if (index === null) return;
    live.current = whack(live.current, index);
    setState(live.current);
  };

  const playAgain = (): void => {
    resetResult();
    submitted.current = false;
    setFailed(false);
    setRound((n) => n + 1);
  };

  return { ctx, state, failed, onWhack, playAgain };
}

export function WhackAMole(): ReactElement {
  const { ctx, state, failed, onWhack, playAgain } = useRound();
  const { initGame, sendTracking } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const over = isOver(state);
  const done = over && (ctx.result !== null || failed);
  const secondsLeft = Math.ceil((ROUND_MS - state.elapsed) / 1000);

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    onWhack(
      holeAt(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      ),
    );
  };

  return (
    <>
      <div className="hud">
        <span className="score">Score: {state.score}</span>
        <span className="time">Time: {secondsLeft}</span>
      </div>
      <div className="card">
        <MoleCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          state={state}
          onPointerDown={onPointerDown}
        />
        {done && (
          <div className="overlay">
            <div className="status">Final score: {state.score}</div>
            <Outcome result={ctx.result} />
          </div>
        )}
      </div>
      {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
