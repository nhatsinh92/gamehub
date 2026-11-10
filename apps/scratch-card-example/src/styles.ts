// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.card { position: relative; width: 100%; flex: 1; background: #ffd966; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.cover { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
