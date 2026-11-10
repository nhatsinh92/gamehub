export const GRID_SIZE = 20;
export const BRUSH_RADIUS = 0.08;
export const REVEAL_THRESHOLD = 0.5;

export type ScratchGrid = {
  readonly size: number;
  readonly cells: readonly boolean[];
};

export function createScratchGrid(size: number = GRID_SIZE): ScratchGrid {
  return { size, cells: Array<boolean>(size * size).fill(false) };
}

/** x, y are card coordinates in 0..1; returns a new grid. */
export function scratchAt(
  grid: ScratchGrid,
  x: number,
  y: number,
  radius: number = BRUSH_RADIUS,
): ScratchGrid {
  if (x < 0 || x > 1 || y < 0 || y > 1) return grid;
  const { size } = grid;
  const cells = grid.cells.map((marked, i) => {
    if (marked) return true;
    const cx = ((i % size) + 0.5) / size;
    const cy = (Math.floor(i / size) + 0.5) / size;
    return Math.hypot(cx - x, cy - y) <= radius;
  });
  return { size, cells };
}

/** Share of scratched cells, 0..1 (0 for an empty grid). */
export function scratchProgress(grid: ScratchGrid): number {
  if (grid.cells.length === 0) return 0;
  return grid.cells.filter(Boolean).length / grid.cells.length;
}
