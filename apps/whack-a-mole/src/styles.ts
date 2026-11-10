// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.hud { display: flex; justify-content: space-between; width: 100%; font-size: 18px; font-weight: bold; }
.card { position: relative; width: 100%; flex: 1; background: #6fbf73; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.board { width: 100%; height: 100%; touch-action: none; cursor: pointer; }
.overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(255, 247, 230, 0.85); }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
