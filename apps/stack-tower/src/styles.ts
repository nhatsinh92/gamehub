// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; background: #dfe8f5; color: #222; border-radius: 12px; outline: none; overflow: hidden; }
.play { max-width: 100%; max-height: 100%; aspect-ratio: 360 / 480; touch-action: none; border-radius: 8px; }
.score { position: absolute; top: 16px; left: 0; right: 0; text-align: center; font-size: 36px; font-weight: bold; color: #1d3557; pointer-events: none; }
.hint { position: absolute; bottom: 24px; left: 0; right: 0; text-align: center; font-size: 16px; color: #1d3557; pointer-events: none; }
.over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(255, 255, 255, 0.8); }
.final-score { font-size: 28px; font-weight: bold; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
