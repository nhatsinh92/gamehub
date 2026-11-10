export const COLS = 4;
export const PAIRS = 8;
export const BOARD_SIZE = 328;
export const GAP = 8;
export const CELL = (BOARD_SIZE - GAP * (COLS + 1)) / COLS;
export const MISMATCH_MS = 1000;

/** Two of each face 0..PAIRS-1, shuffled (Fisher-Yates) with `rand` in [0, 1). */
export function buildDeck(rand: () => number): number[] {
  const deck = Array.from({ length: PAIRS * 2 }, (_, i) => i % PAIRS);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = deck[i] as number;
    deck[i] = deck[j] as number;
    deck[j] = a;
  }
  return deck;
}

/** Top-left corner of the card at `index`, in board pixels. */
export function cellOrigin(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: GAP + col * (CELL + GAP), y: GAP + row * (CELL + GAP) };
}

/** Card index under a board point, or -1 for a gap or outside. */
export function cellAt(x: number, y: number): number {
  for (let i = 0; i < PAIRS * 2; i++) {
    const o = cellOrigin(i);
    if (x >= o.x && x < o.x + CELL && y >= o.y && y < o.y + CELL) return i;
  }
  return -1;
}

export interface Board {
  deck: number[];
  matched: boolean[];
  /** indexes currently face up but not matched (0, 1 or 2) */
  open: number[];
  moves: number;
}

export function newBoard(deck: number[]): Board {
  return { deck, matched: deck.map(() => false), open: [], moves: 0 };
}

export function isLocked(b: Board): boolean {
  return b.open.length === 2;
}

export function isDone(b: Board): boolean {
  return b.matched.every(Boolean);
}

/** Flip card `i`. Ignored when locked, already face up or matched. */
export function flip(b: Board, i: number): Board {
  if (i < 0 || isLocked(b) || b.matched[i] || b.open.includes(i)) return b;
  const open = [...b.open, i];
  if (open.length === 1) return { ...b, open };
  const [a] = open as [number, number];
  const moves = b.moves + 1;
  if (b.deck[a] === b.deck[i]) {
    const matched = b.matched.slice();
    matched[a] = true;
    matched[i] = true;
    return { ...b, matched, open: [], moves };
  }
  return { ...b, open, moves };
}

/** Flip a mismatched pair back down. */
export function hide(b: Board): Board {
  return { ...b, open: [] };
}
