// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GAME_ID, SDK_GLOBAL_NAME } from "./game-name.ts";
import * as sdk from "./sdk.ts";
import { GAME_CSS } from "./styles.ts";
import {
  TOKEN,
  WIN,
  flush,
  scratchAll,
  stubCanvasRect,
} from "./test-helpers.tsx";

const BASE = "https://api.test";
const consoleSpies = (["error", "log", "warn", "info", "debug"] as const).map(
  (m) => vi.spyOn(console, m).mockImplementation(() => {}),
);
const [errorSpy] = consoleSpies;
let urls: string[] = [];
let headersSeen: HeadersInit[] = [];

function cfg(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    gameId: GAME_ID,
    baseUrl: BASE,
    getAccessTokenFunc: () => TOKEN,
    ...extra,
  };
}

function host(): HTMLElement {
  const el = document.createElement("div");
  el.id = "game";
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  urls = [];
  headersSeen = [];
  consoleSpies.forEach((s) => s.mockClear());
  stubCanvasRect(360, 480);
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit) => {
      urls.push(String(url));
      headersSeen.push(init.headers ?? {});
      const data = String(url).endsWith("/reward") ? WIN : {};
      return Promise.resolve(
        new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }),
  );
});

afterEach(() => {
  sdk.destroy();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("shape", () => {
  test("[003:FR-004] exposes exactly init and destroy", () => {
    expect(Object.keys(sdk).sort()).toEqual(["destroy", "init"]);
  });
});

describe("init", () => {
  test("[003:FR-005] selector and Element both render one game", async () => {
    const a = host();
    sdk.init("#game", cfg());
    await flush();
    expect(a.shadowRoot?.querySelectorAll(".game").length).toEqual(1);
    sdk.destroy();
    const b = document.createElement("div");
    document.body.appendChild(b);
    sdk.init(b, cfg());
    await flush();
    expect(b.shadowRoot?.querySelectorAll(".game").length).toEqual(1);
  });

  test("[003:FR-006] shadow root holds one style plus the game; page untouched", async () => {
    const el = host();
    const headBefore = [...document.head.children];
    const bodyBefore = [...document.body.children];
    sdk.init(el, cfg());
    await flush();
    const kids = [...(el.shadowRoot?.children ?? [])];
    expect(kids.map((k) => k.tagName)).toEqual(["STYLE", "DIV"]);
    expect(kids[0]?.textContent).toEqual(GAME_CSS);
    expect(kids[1]?.querySelectorAll(".game").length).toEqual(1);
    expect([...document.head.children]).toEqual(headBefore);
    expect([...document.body.children]).toEqual(bodyBefore);
    expect(GAME_CSS.startsWith(":host { all: initial; display: block;")).toEqual(
      true,
    );
  });

  test("[003:FR-007] init twice replaces the game", async () => {
    const el = host();
    sdk.init(el, cfg());
    sdk.init(el, cfg());
    await flush();
    expect(el.shadowRoot?.querySelectorAll(".game").length).toEqual(1);
    const second = document.createElement("div");
    document.body.appendChild(second);
    sdk.init(second, cfg());
    await flush();
    expect(el.shadowRoot?.childNodes.length).toEqual(0);
    expect(second.shadowRoot?.querySelectorAll(".game").length).toEqual(1);
  });

  test("[003:FR-009] destroy empties container and shadow root; repeat is a no-op", async () => {
    sdk.destroy();
    const el = host();
    sdk.init(el, cfg());
    await flush();
    sdk.destroy();
    expect(el.childNodes.length).toEqual(0);
    expect(el.shadowRoot?.childNodes.length).toEqual(0);
    sdk.destroy();
    expect(errorSpy?.mock.calls).toEqual([]);
  });

  test("[003:FR-010] sizes on the game root", async () => {
    const el = host();
    sdk.init(el, cfg({ width: 200, height: 300 }));
    await flush();
    const game = el.shadowRoot?.querySelector(".game") as HTMLElement;
    expect([game.style.width, game.style.height]).toEqual(["200px", "300px"]);
    sdk.init(el, cfg());
    await flush();
    const dflt = el.shadowRoot?.querySelector(".game") as HTMLElement;
    expect([dflt.style.width, dflt.style.height]).toEqual(["360px", "480px"]);
  });

  test("[003:FR-011] host tracking function gets the events", async () => {
    const track = vi.fn();
    sdk.init(host(), cfg({ sendTrackingFunc: track }));
    await flush();
    expect(track.mock.calls).toEqual([[{ name: "game_open" }]]);
  });
});

describe("bad input", () => {
  const P = `[${SDK_GLOBAL_NAME}] init: `;
  const bad = (field: string, rule: string) =>
    `config.${field} is required and must be ${rule}`;
  const cases: [string, () => [unknown, unknown], string][] = [
    ["missing selector", () => ["#nope", cfg()], 'container "#nope" not found'],
    [
      "invalid selector",
      () => ["##", cfg()],
      'invalid container selector "##"',
    ],
    [
      "number container",
      () => [42, cfg()],
      "container must be a CSS selector or an Element",
    ],
    ["null config", () => ["#game", null], "config must be an object"],
    [
      "no gameId",
      () => ["#game", cfg({ gameId: undefined })],
      bad("gameId", "a non-empty string"),
    ],
    [
      "empty baseUrl",
      () => ["#game", cfg({ baseUrl: "" })],
      bad("baseUrl", "a non-empty string"),
    ],
    [
      "no token func",
      () => ["#game", cfg({ getAccessTokenFunc: "x" })],
      bad("getAccessTokenFunc", "a function"),
    ],
    [
      "bad tracking",
      () => ["#game", cfg({ sendTrackingFunc: 1 })],
      "config.sendTrackingFunc must be a function",
    ],
    [
      "width 0",
      () => ["#game", cfg({ width: 0 })],
      "config.width must be a positive number",
    ],
    [
      "height -1",
      () => ["#game", cfg({ height: -1 })],
      "config.height must be a positive number",
    ],
  ];

  test.each(cases)("[003:FR-008] %s", (_n, build, message) => {
    const el = host();
    const [container, config] = build();
    expect(() => sdk.init(container as string, config)).not.toThrow();
    expect(el.shadowRoot).toEqual(null);
    expect(el.childNodes.length).toEqual(0);
    expect(errorSpy?.mock.calls).toEqual([[P + message]]);
  });

  test("[003:FR-008] an element that cannot host a shadow root", () => {
    const el = host();
    vi.spyOn(el, "attachShadow").mockImplementation(() => {
      throw new Error("NotSupportedError");
    });
    expect(() => sdk.init(el, cfg())).not.toThrow();
    expect(el.childNodes.length).toEqual(0);
    expect(errorSpy?.mock.calls).toEqual([
      [P + "container cannot host a shadow root"],
    ]);
  });
});

describe("embedded round", () => {
  test("[003:FR-003] [003:FR-024] only game-core URLs; token only in header; no console output", async () => {
    const el = host();
    sdk.init(el, cfg());
    await flush();
    scratchAll(el.shadowRoot?.querySelector("canvas.cover") ?? el);
    await flush();
    expect(urls).toEqual([`${BASE}/${GAME_ID}/v1/init`, `${BASE}/${GAME_ID}/v1/reward`]);
    const rewardHeaders = headersSeen[1] as Record<string, string>;
    expect(rewardHeaders["X-Access-Token"]).toEqual(TOKEN);
    expect(consoleSpies.map((s) => s.mock.calls)).toEqual([[], [], [], [], []]);
  });
});
