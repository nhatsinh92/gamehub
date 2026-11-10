# Quickstart: gen-game validation

Prerequisites: Node 24, pnpm, `pnpm install` done at the repository root, clean working tree.

## 1. Package checks

```sh
pnpm turbo run lint check-types test --filter=@repo/gen-game
```

Expected: all pass; tests write only to temporary folders (`git status` stays clean).

## 2. Rejections (nothing written)

```sh
pnpm gen-game                       # usage, exit 1
pnpm gen-game LuckyWheel            # not kebab-case, exit 1
pnpm gen-game scratch-card-example  # template name, exit 1
pnpm gen-game game-core             # used by packages/game-core, exit 1
git status --porcelain              # empty
```

Messages: [contracts/cli.md](contracts/cli.md).

## 3. End-to-end: a generated game passes every check (FR-014)

```sh
pnpm gen-game lucky-wheel           # prints Created apps/lucky-wheel + next steps, exit 0
grep -rl -e scratch-card-example -e ScratchCardExampleSDK apps/lucky-wheel   # no output
git diff --exit-code apps/scratch-card-example                               # template unchanged
pnpm install
pnpm turbo run lint check-types test buildSdk --filter=lucky-wheel           # all pass, no edits
grep -c "LuckyWheelSDK" apps/lucky-wheel/dist/lucky-wheel-sdk.js             # ≥ 1
pnpm gen-game lucky-wheel           # exists → exit 1, nothing changed
```

The copied `sdk-build.test.ts` already asserts that the built file defines exactly the `LuckyWheelSDK` global with `init` and `destroy`.

Clean up (the generated game is not committed):

```sh
rm -rf apps/lucky-wheel
pnpm install                        # restores pnpm-lock.yaml
git status --porcelain              # empty
```
