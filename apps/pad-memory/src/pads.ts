export const PAD_COUNT = 4;
export const PAD_COLORS: readonly { dim: string; bright: string }[] = [
  { dim: "#7a2f3a", bright: "#ff5d73" },
  { dim: "#2f5d7a", bright: "#4fc3ff" },
  { dim: "#7a6a2f", bright: "#ffd84f" },
  { dim: "#2f7a4d", bright: "#4fff9a" },
];

export const MIN_LIT_MS = 250;

/** Playback speeds up a little every 5 rounds (sequence length), up to a cap. */
export function litMs(round: number): number {
  const level = Math.floor((Math.max(round, 1) - 1) / 5);
  return Math.max(MIN_LIT_MS, 600 - 50 * level);
}

export function gapMs(round: number): number {
  return Math.round(litMs(round) / 3);
}

export function randomPad(): number {
  return Math.min(PAD_COUNT - 1, Math.floor(Math.random() * PAD_COUNT));
}

/** Pad index (0..3, row-major) at a fraction of the board, or null if outside. */
export function padAt(fx: number, fy: number): number | null {
  if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return null;
  return (fy < 0.5 ? 0 : 2) + (fx < 0.5 ? 0 : 1);
}
