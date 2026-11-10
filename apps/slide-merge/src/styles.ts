// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: #1d1c28; color: #f1eefc; border-radius: 12px; }
.score { font-size: 22px; font-weight: bold; }
.board { width: 100%; max-width: 320px; aspect-ratio: 1; touch-action: none; border-radius: 8px; }
.over { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.prize { font-size: 20px; font-weight: bold; text-align: center; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #6a8cf0; color: #fff; cursor: pointer; }
`;
