import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Stage } from "./Stage.tsx";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  gameOver: "Game over",
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

export function Sniper(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  const onOver = (score: number): void => {
    setFinalScore(score);
    sendTracking({ name: "game_over", params: { score } });
    void submitResult(score).then((result) => {
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
    setFailed(false);
    setFinalScore(null);
    setRound((n) => n + 1);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const done = finalScore !== null && (ctx.result !== null || failed);
  return (
    <div className="play">
      <Stage key={round} onOver={onOver} />
      {finalScore !== null && (
        <div className="over">
          <div className="title">{TEXT.gameOver}</div>
          <div className="final">{finalScore}</div>
          {done && <Outcome result={ctx.result} />}
          {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
        </div>
      )}
    </div>
  );
}
