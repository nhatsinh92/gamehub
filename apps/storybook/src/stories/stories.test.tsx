// @vitest-environment happy-dom
import { act } from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";

interface StoryModule {
  default: { title: string };
  Default: { render: () => ReactElement };
}

const modules = import.meta.glob<StoryModule>("./*.stories.tsx", {
  eager: true,
});

const names = Object.keys(modules)
  .map((path) => path.replace("./", "").replace(".stories.tsx", ""))
  .sort();

afterEach(() => {
  vi.unstubAllGlobals();
});

test("[006:FR-002] one story per existing game", () => {
  expect(names).toEqual(["scratch-card-example", "sky-hopper"]);
});

test("[006:FR-003] [006:FR-006] each story renders its game root, with the game CSS, and no network", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const seen: { title: string; roots: number; hasCss: boolean }[] = [];
  for (const name of names) {
    const mod = modules[`./${name}.stories.tsx`];
    if (!mod) throw new Error(`missing story ${name}`);
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    act(() => {
      root.render(mod.Default.render());
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    seen.push({
      title: mod.default.title,
      roots: div.querySelectorAll(".game").length,
      hasCss: (div.querySelector("style")?.textContent ?? "").includes(".game"),
    });
    act(() => {
      root.unmount();
    });
    div.remove();
  }
  expect(seen).toEqual([
    { title: "scratch-card-example", roots: 1, hasCss: true },
    { title: "sky-hopper", roots: 1, hasCss: true },
  ]);
  expect(fetchSpy.mock.calls).toEqual([]);
});
