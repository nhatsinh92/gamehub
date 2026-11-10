export interface GameConfig {
  readonly width: number;
  readonly height: number;
  readonly groundHeight: number;
  readonly gravity: number;
  readonly flapVelocity: number;
  readonly birdX: number;
  readonly birdWidth: number;
  readonly birdHeight: number;
  readonly pipeWidth: number;
  readonly pipeSpacing: number;
  readonly gapMargin: number;
  readonly speedStart: number;
  readonly speedMax: number;
  readonly speedPerPoint: number;
  readonly gapStart: number;
  readonly gapMin: number;
  readonly gapPerPoint: number;
  readonly stepSeconds: number;
  readonly maxSteps: number;
}

/** Every tunable value of the game; change them here after a playtest. */
export const CONFIG: Readonly<GameConfig> = Object.freeze({
  width: 450,
  height: 700,
  groundHeight: 80,
  gravity: 790,
  flapVelocity: -290,
  birdX: 120,
  birdWidth: 34,
  birdHeight: 24,
  pipeWidth: 70,
  pipeSpacing: 240,
  gapMargin: 60,
  speedStart: 170,
  speedMax: 280,
  speedPerPoint: 5,
  gapStart: 200,
  gapMin: 140,
  gapPerPoint: 3,
  stepSeconds: 1 / 120,
  maxSteps: 12,
});
