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

export const CONFIG: Readonly<GameConfig> = Object.freeze({
  width: 0,
  height: 0,
  groundHeight: 0,
  gravity: 0,
  flapVelocity: 0,
  birdX: 0,
  birdWidth: 0,
  birdHeight: 0,
  pipeWidth: 0,
  pipeSpacing: 0,
  gapMargin: 0,
  speedStart: 0,
  speedMax: 0,
  speedPerPoint: 0,
  gapStart: 0,
  gapMin: 0,
  gapPerPoint: 0,
  stepSeconds: 0,
  maxSteps: 0,
});
