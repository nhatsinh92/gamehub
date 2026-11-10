// Pure snake rules. Cells are integers; the outer ring of the grid is the wall.
export const GRID = 20;
export interface Point {
  x: number;
  y: number;
}
export type Dir = "up" | "down" | "left" | "right";
export const VECTORS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const PREY_EVERY = 3; // prey moves once per this many ticks
const BASE_MS = 160;
const MIN_MS = 70;

export interface State {
  snake: Point[]; // head first
  dir: Dir;
  prey: Point;
  score: number;
  ticks: number;
  over: boolean;
}

export type Rng = () => number;

const same = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;
const isWall = (p: Point): boolean =>
  p.x <= 0 || p.y <= 0 || p.x >= GRID - 1 || p.y >= GRID - 1;

function freeCells(snake: Point[]): Point[] {
  const cells: Point[] = [];
  for (let y = 1; y < GRID - 1; y++)
    for (let x = 1; x < GRID - 1; x++) {
      const p = { x, y };
      if (!snake.some((s) => same(s, p))) cells.push(p);
    }
  return cells;
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))] as T;
}

export function newState(rng: Rng): State {
  const snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  return {
    snake,
    dir: "right",
    prey: pick(freeCells(snake), rng),
    score: 0,
    ticks: 0,
    over: false,
  };
}

/** A turn straight back into the snake is ignored. */
export function turn(current: Dir, wanted: Dir): Dir {
  return OPPOSITE[wanted] === current ? current : wanted;
}

export function tickMs(score: number): number {
  return Math.max(MIN_MS, BASE_MS - 10 * Math.floor(score / 5));
}

function movePrey(prey: Point, snake: Point[], rng: Rng): Point {
  const options = Object.values(VECTORS)
    .map((v) => ({ x: prey.x + v.x, y: prey.y + v.y }))
    .filter((p) => !isWall(p) && !snake.some((s) => same(s, p)));
  return options.length === 0 ? prey : pick(options, rng);
}

export function step(state: State, wanted: Dir, rng: Rng): State {
  if (state.over) return state;
  const dir = turn(state.dir, wanted);
  const v = VECTORS[dir];
  const head = state.snake[0] as Point;
  const next = { x: head.x + v.x, y: head.y + v.y };
  const ticks = state.ticks + 1;
  const catches = same(next, state.prey);
  // the tail cell frees up this tick unless the snake grows
  const body = catches ? state.snake : state.snake.slice(0, -1);
  if (isWall(next) || body.some((s) => same(s, next))) {
    return { ...state, dir, ticks, over: true };
  }
  const snake = [next, ...body];
  if (catches) {
    const free = freeCells(snake);
    // a full board: nothing left to hunt
    if (free.length === 0) {
      return { ...state, snake, dir, ticks, score: state.score + 1, over: true };
    }
    return {
      snake,
      dir,
      ticks,
      score: state.score + 1,
      prey: pick(free, rng),
      over: false,
    };
  }
  const prey =
    ticks % PREY_EVERY === 0 ? movePrey(state.prey, snake, rng) : state.prey;
  return { ...state, snake, dir, ticks, prey };
}
