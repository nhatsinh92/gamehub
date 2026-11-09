import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement } from "react";
import { createHttpClient } from "./http-client.ts";
import type {
  AdapterEnv,
  CurrentUser,
  GameConfig,
  GameContextProviderProps,
  GameContextValue,
  GameCoreError,
  GameResult,
  Outcome,
  TrackingEvent,
} from "./types.ts";

export const GameContext = createContext<GameContextValue | undefined>(
  undefined,
);

interface State {
  config: GameConfig | null;
  currentUser: CurrentUser | null;
  result: GameResult | null;
  error: GameCoreError | null;
}

type Runner = <T>(
  name: string,
  call: () => Promise<Outcome<T>>,
  store: (data: T) => Partial<State>,
) => Promise<T | null>;

function useRequestState(): {
  state: State;
  isLoading: boolean;
  setState: (patch: Partial<State>) => void;
  runOperation: Runner;
} {
  const [state, setFull] = useState<State>({
    config: null,
    currentUser: null,
    result: null,
    error: null,
  });
  const [pending, setPending] = useState(0);
  const setState = useCallback((patch: Partial<State>) => {
    setFull((prev) => ({ ...prev, ...patch }));
  }, []);
  const runOperation: Runner = useCallback(
    async (name, call, store) => {
      setPending((n) => n + 1);
      let outcome: Outcome<unknown>;
      try {
        outcome = await call();
      } catch {
        outcome = {
          ok: false,
          error: { kind: "unknown", message: `Adapter failed: ${name}` },
        };
      }
      setPending((n) => n - 1);
      if (!outcome.ok) {
        setState({ error: outcome.error });
        return null;
      }
      setState({ ...store(outcome.data as never), error: null });
      return outcome.data as never;
    },
    [setState],
  );
  return { state, isLoading: pending > 0, setState, runOperation };
}

function makeSendTracking(ref: {
  current: GameContextProviderProps["sendTrackingFunc"];
}): (event: TrackingEvent) => void {
  return (event) => {
    try {
      const out = ref.current?.(event);
      if (out && typeof out.catch === "function") out.catch(() => {});
    } catch {
      // host tracking must never break the game
    }
  };
}

export function GameContextProvider(
  props: GameContextProviderProps,
): ReactElement {
  const { gameId, adapter, httpConfig, children } = props;
  const { state, isLoading, setState, runOperation } = useRequestState();
  const trackingRef = useRef(props.sendTrackingFunc);
  trackingRef.current = props.sendTrackingFunc;
  const env: AdapterEnv = useMemo(
    () => ({ gameId, http: createHttpClient(httpConfig) }),
    [
      gameId,
      httpConfig.baseUrl,
      httpConfig.getAccessTokenFunc,
      httpConfig.fetchFunc,
    ],
  );
  const value: GameContextValue = {
    ...state,
    isLoading,
    initGame: () =>
      runOperation(
        "initGame",
        () => adapter.getConfig(env),
        (config) => ({ config }),
      ),
    getCurrentUser: () =>
      runOperation(
        "getCurrentUser",
        () => adapter.getCurrentUser(env),
        (currentUser) => ({ currentUser }),
      ),
    submitResult: (score) => {
      if (typeof score !== "number" || !Number.isFinite(score)) {
        setState({
          error: {
            kind: "input",
            message: "Invalid score: expected a finite number",
          },
        });
        return Promise.resolve(null);
      }
      return runOperation(
        "submitResult",
        () => adapter.submitResult(env, score),
        (result) => ({ result }),
      );
    },
    resetResult: () => setState({ result: null }),
    sendTracking: makeSendTracking(trackingRef),
  };
  return createElement(GameContext.Provider, { value }, children);
}

export function useGameContext(): GameContextValue {
  const value = useContext(GameContext);
  if (value === undefined) {
    throw new Error("useGameContext must be used inside GameContextProvider");
  }
  return value;
}
