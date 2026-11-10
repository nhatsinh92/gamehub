import { GameContextProvider } from "@repo/game-core";
import type { ReactElement } from "react";
import { AsteroidDodge } from "./AsteroidDodge.tsx";
import type { MountOptions } from "./mount-game.tsx";

export function App(props: MountOptions): ReactElement {
  const { gameId, adapter, httpConfig, sendTrackingFunc, width, height } =
    props;
  return (
    <GameContextProvider
      gameId={gameId}
      adapter={adapter}
      httpConfig={httpConfig}
      sendTrackingFunc={sendTrackingFunc}
    >
      <div className="game" style={{ width, height }}>
        <AsteroidDodge />
      </div>
    </GameContextProvider>
  );
}
