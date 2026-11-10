import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { ScratchCanvas } from "./ScratchCanvas.tsx";
import { REVEAL_THRESHOLD, scratchProgress } from "./scratch-progress.ts";
import type { ScratchGrid } from "./scratch-progress.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

// Card size comes from the CSS box; the canvas bitmap uses a fixed size.
const CARD_WIDTH = 328;
const CARD_HEIGHT = 380;

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
  const [revealed, setRevealed] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitted = useRef(false);
  const { sendTracking, submitResult, resetResult } = ctx;

  const onScratch = (grid: ScratchGrid): void => {
    if (submitted.current || scratchProgress(grid) < REVEAL_THRESHOLD) return;
    submitted.current = true;
    setRevealed(true);
    sendTracking({ name: "game_reveal" });
    void submitResult(1).then((result) => {
      if (result) {
        sendTracking({
          name: "game_result",
          params: { status: result.status, isWin: result.isWin },
        });
      } else setFailed(true);
    });
  };

  const playAgain = (): void => {
    resetResult();
    submitted.current = false;
    setRevealed(false);
    setFailed(false);
    setRound((n) => n + 1);
  };

  return { ctx, round, revealed, failed, onScratch, playAgain };
}

export function ScratchCard(): ReactElement {
  const { ctx, round, revealed, failed, onScratch, playAgain } = useRound();
  const { initGame, sendTracking } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);

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
      <div className="card">
        {done && <Outcome result={ctx.result} />}
        {!revealed && (
          <ScratchCanvas
            key={round}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            disabled={false}
            onScratch={onScratch}
          />
        )}
      </div>
      {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
