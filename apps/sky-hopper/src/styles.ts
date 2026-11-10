// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #1d2b3a; color: #222; border-radius: 12px; overflow: hidden; outline: none; }
canvas.play { aspect-ratio: 450 / 700; max-width: 100%; max-height: 100%; touch-action: none; cursor: pointer; }
.score { position: absolute; top: 8px; left: 0; right: 0; text-align: center; font-size: 40px; font-weight: bold; color: #fff; text-shadow: 0 2px 4px #000; pointer-events: none; }
.hint { position: absolute; bottom: 16%; left: 0; right: 0; text-align: center; font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 1px 3px #000; }
.over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(0, 0, 0, 0.55); color: #fff; }
.final-score { font-size: 28px; font-weight: bold; }
.best-score { font-size: 18px; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; padding: 8px; color: #fff; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
