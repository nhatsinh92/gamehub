export const HOLES = 9;
export const ROUND_MS = 30_000;

export interface MoleState {
  /** ms since the round started */
  elapsed: number;
  /** per hole: the elapsed time at which the mole hides again, or null */
  moles: (number | null)[];
  score: number;
  nextSpawn: number;
}

export function createState(): MoleState {
  return {
    elapsed: 0,
    moles: Array.from({ length: HOLES }, () => null),
    score: 0,
    nextSpawn: 400,
  };
}

/** Time between spawns shrinks as the round goes on. */
export function spawnInterval(elapsed: number): number {
  return Math.max(350, 900 - elapsed * 0.02);
}

/** How long a mole stays up; also shrinks over time. */
export function moleLifetime(elapsed: number): number {
  return Math.max(550, 1200 - elapsed * 0.022);
}

export function isOver(state: MoleState): boolean {
  return state.elapsed >= ROUND_MS;
}

/** Advance to `elapsed` ms. `rand` returns a number in [0, 1). */
export function advance(
  state: MoleState,
  elapsed: number,
  rand: () => number,
): MoleState {
  const now = Math.min(elapsed, ROUND_MS);
  const moles = state.moles.map((until) =>
    until !== null && until <= now ? null : until,
  );
  let nextSpawn = state.nextSpawn;
  while (nextSpawn <= now) {
    const free = moles.flatMap((m, i) => (m === null ? [i] : []));
    const hole = free[Math.floor(rand() * free.length)];
    if (hole !== undefined) moles[hole] = nextSpawn + moleLifetime(nextSpawn);
    nextSpawn += spawnInterval(nextSpawn);
  }
  return { ...state, elapsed: now, moles, nextSpawn };
}

/** Whack hole `index`: scores 1 if a mole is up there. */
export function whack(state: MoleState, index: number): MoleState {
  if (isOver(state) || state.moles[index] == null) return state;
  const moles = state.moles.map((m, i) => (i === index ? null : m));
  return { ...state, moles, score: state.score + 1 };
}
