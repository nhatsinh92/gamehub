// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.hud { display: flex; justify-content: space-between; width: 100%; max-width: 328px; font-size: 18px; font-weight: bold; }
.board { width: 100%; max-width: 328px; aspect-ratio: 1; background: #ffd966; border-radius: 8px; touch-action: manipulation; cursor: pointer; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
