// devSdk: watch-builds the SDK and serves a host page that loads it with a <script> tag,
// against a tiny local mock API. Run with `pnpm devSdk`.
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import type { Plugin } from "vite";
import { GAME_ID, SDK_GLOBAL_NAME } from "../src/game-name.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const sdkFile = `${GAME_ID}-sdk.js`;
const API = `/mock-api/${GAME_ID}/v1`;
const DEV_TOKEN = "dev-token-not-secret";

const USER = {
  nickname: "Dev Player",
  totalTurns: 10,
  remainingTurns: 10,
  bestScore: 0,
  currentRank: null,
};
const RESULT = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "dev-reward", name: "Dev reward", code: "DEV" },
  remainingTurns: 9,
  message: "Dev mock result",
};

// loud host styles show that the game is isolated from the page
const hostPage = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>SDK host page</title>
    <style>
      * { color: red; font-family: serif; }
      button { border: 4px solid red; }
      h1 { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>Host page</h1>
    <div id="game"></div>
    <script src="/dist/${sdkFile}"></script>
    <script>
      ${SDK_GLOBAL_NAME}.init("#game", {
        gameId: ${JSON.stringify(GAME_ID)},
        baseUrl: "/mock-api",
        getAccessTokenFunc: () => ${JSON.stringify(DEV_TOKEN)},
      });
    </script>
  </body>
</html>`;

function send(res: ServerResponse, type: string, body: string): void {
  res.setHeader("Content-Type", type);
  res.end(body);
}

function hostPlugin(): Plugin {
  const json = (res: ServerResponse, data: unknown) =>
    send(res, "application/json", JSON.stringify({ data }));
  return {
    name: "dev-sdk-host",
    configureServer(server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next) => {
          const path = (req.url ?? "/").split("?")[0] ?? "/";
          if (path === "/") return send(res, "text/html", hostPage);
          if (path === `${API}/init`) return json(res, {});
          if (path === `${API}/me`) return json(res, USER);
          if (path === `${API}/reward`) return json(res, RESULT);
          if (path === `/dist/${sdkFile}`) {
            try {
              const code = await readFile(`${root}dist/${sdkFile}`, "utf8");
              return send(res, "text/javascript", code);
            } catch {
              res.statusCode = 404;
              return send(res, "text/plain", "SDK not built yet, retry");
            }
          }
          next();
        },
      );
    },
  };
}

await build({
  root,
  configFile: `${root}vite.config.ts`,
  mode: "development",
  build: { watch: {} },
});

const server = await createServer({
  root,
  configFile: false,
  server: { port: 5174 },
  plugins: [hostPlugin()],
});
await server.listen();
server.printUrls();
