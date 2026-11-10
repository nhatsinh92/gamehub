export const SIZE = 4;
export type Board = readonly number[];
export type Dir = "left" | "right" | "up" | "down";

export function emptyBoard(): Board {
  return Array<number>(SIZE * SIZE).fill(0);
}

/** Index of the i-th cell of line `n` when sliding toward `dir` (i = 0 is the wall side). */
function cellIndex(dir: Dir, n: number, i: number): number {
  switch (dir) {
    case "left":
      return n * SIZE + i;
    case "right":
      return n * SIZE + (SIZE - 1 - i);
    case "up":
      return i * SIZE + n;
    case "down":
      return (SIZE - 1 - i) * SIZE + n;
  }
}

export function slide(
  board: Board,
  dir: Dir,
): { board: Board; gained: number; moved: boolean } {
  const next = Array<number>(SIZE * SIZE).fill(0);
  let gained = 0;
  for (let n = 0; n < SIZE; n++) {
    const values: number[] = [];
    for (let i = 0; i < SIZE; i++) {
      const v = board[cellIndex(dir, n, i)] ?? 0;
      if (v !== 0) values.push(v);
    }
    const merged: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i] ?? 0;
      if (values[i + 1] === v) {
        merged.push(v * 2);
        gained += v * 2;
        i++;
      } else merged.push(v);
    }
    merged.forEach((v, i) => {
      next[cellIndex(dir, n, i)] = v;
    });
  }
  const moved = next.some((v, i) => v !== board[i]);
  return { board: moved ? next : board, gained, moved };
}

/** Puts a 2 (90%) or a 4 (10%) on a random free cell. `rng` returns [0, 1). */
export function spawn(board: Board, rng: () => number): Board {
  const free: number[] = [];
  board.forEach((v, i) => {
    if (v === 0) free.push(i);
  });
  if (free.length === 0) return board;
  const cell = free[Math.floor(rng() * free.length)] ?? free[0] ?? 0;
  const next = [...board];
  next[cell] = rng() < 0.9 ? 2 : 4;
  return next;
}

export function newBoard(rng: () => number): Board {
  return spawn(spawn(emptyBoard(), rng), rng);
}

export function isOver(board: Board): boolean {
  const dirs: Dir[] = ["left", "right", "up", "down"];
  return dirs.every((d) => !slide(board, d).moved);
}
