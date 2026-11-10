import { useEffect, useRef } from "react";
import { advanceClock, pauseClock, START_CLOCK } from "./game/clock.ts";
import { CONFIG } from "./game/config.ts";

/**
 * Runs `onSteps(n)` on every animation frame with the number of fixed steps to
 * take. Pauses while the page is hidden and takes no steps for the hidden time.
 */
export function useGameLoop(
  enabled: boolean,
  onSteps: (steps: number) => void,
): void {
  const latest = useRef(onSteps);
  latest.current = onSteps;

  useEffect(() => {
    if (!enabled) return;
    let clock = START_CLOCK;
    let id: number | null = null;
    const frame = (now: number): void => {
      id = requestAnimationFrame(frame);
      const next = advanceClock(clock, now, CONFIG);
      clock = next.clock;
      latest.current(next.steps);
    };
    const stop = (): void => {
      if (id !== null) cancelAnimationFrame(id);
      id = null;
      clock = pauseClock(clock);
    };
    const onVisibility = (): void => {
      stop();
      if (document.visibilityState !== "hidden") id = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (document.visibilityState !== "hidden") id = requestAnimationFrame(frame);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [enabled]);
}
