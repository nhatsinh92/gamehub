// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: #0d2019; color: #e8f5ec; border-radius: 12px; }
.score { font-size: 20px; font-weight: bold; }
.card { position: relative; width: 100%; max-width: 400px; aspect-ratio: 1; border-radius: 8px; overflow: hidden; }
.board { display: block; width: 100%; height: 100%; touch-action: none; }
.overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(13, 32, 25, 0.85); }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #f2c14e; color: #222; cursor: pointer; }
`;
