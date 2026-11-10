# Learning Log — GameHub SDD

Mỗi Module một entry: **Đã làm gì · Quyết định và vì sao · Vấp ở đâu · Soundbite phỏng vấn** (2–4 câu, có số liệu hoặc tên file cụ thể).

---

## Module 0 — Khởi động: đọc brief, hiểu SDD (2026-11-03)

### Đã làm gì
- Cài Spec Kit 1.2.3, `specify init` với Claude (commit `chore: init speckit`).
- Đặt câu hỏi cho PO về lượt chơi, tracking, ngân sách hiệu năng, tắt game giữa ván, nghĩa của "công bằng" (câu trả lời tóm tắt ở mục *Quyết định* bên dưới).
- (2026-11-04) Bỏ `docs/product-brief.md`: brief trong guide không đúng với thực tế lúc khởi tạo GameHub.

### Quyết định và vì sao
- **Server sở hữu lượt chơi và quà; client chỉ hiển thị.** Vì "công bằng" và chống gian lận: client không đáng tin.
- **Trạng thái bảo trì không trừ lượt.** Tắt game giữa ván không được làm người chơi mất lượt.
- **Tracking là contract dùng chung**, có schema riêng, không chứa token/PII. Vì marketing cần so sánh giữa các game.
- **Ngân sách hiệu năng là con số trong constitution**, quy đổi từ yêu cầu trải nghiệm của PO ("~3 giây trên 4G, không giật").

### Chênh lệch giữa bản cài Spec Kit và guide (mục C1)
- Lệnh `/speckit-*` được cài dưới dạng **skill** ở `.claude/skills/<tên>/SKILL.md`, không phải `.claude/commands/`.
- Có thêm 2 lệnh ngoài danh sách của guide: `speckit-converge` (đối chiếu code với spec/plan/tasks, thêm task còn thiếu vào `tasks.md`) và `speckit-taskstoissues` (đã deprecated).
- Script chỉ có bản **PowerShell** (`.specify/scripts/powershell/`), không có bash: `create-new-feature.ps1`, `setup-plan.ps1`, `setup-tasks.ps1`, …
- Có thêm `.specify/workflows/` (`workflow.yml`, `workflow-registry.json`) và `.specify/templates/constitution-template.md`, guide không nhắc tới.
- Spec Kit 1.2.3 không tự tạo branch (việc tạo branch tách ra thành extension git) → tự `git switch -c NNN-<tên>`.

### Vấp ở đâu
- Câu hỏi PO đầu tiên còn chung chung; chưa nghĩ tới các cụm mơ hồ trong brief làm đổi thiết kế ("công bằng", "bundle nhỏ", tắt game giữa ván).

### Soundbite phỏng vấn (Q1)
> Trước khi viết spec, tôi soi các cụm mơ hồ như "nhận quà công bằng" hay "bundle nhỏ" và hỏi PO, vì đó là chỗ AI sẽ tự đoán nếu spec im lặng. Câu trả lời biến thành quyết định cụ thể (server quyết quà, trạng thái bảo trì không trừ lượt), rồi mới tách thành các feature spec. Code chỉ được viết sau khi spec đã được duyệt.

---

## Module 1 — Constitution, policy, scaffold (2026-11-04 → 2026-11-05)

### Đã làm gì
- Tự viết prompt và chạy `/speckit-constitution` → constitution **v1.0.0**: 5 principle cơ bản (Spec-First, Humans Decide/AI Proposes, Verified Against the Spec, Simplicity, No Secrets) + Growth rule.
- Sửa đổi 2 lần:
  - **1.0.1 (PATCH):** sửa định dạng ví dụ tag `[006:FR-001]`.
  - **1.1.0 (MINOR):** Principle IV, thay đổi được miễn spec thì ghi lý do dependency vào PR description (commit message khi chưa có PR).
- `CLAUDE.md` luật 1: mọi `spec.md` phải có `**Version**` và `## Changelog`.
- `.gitattributes` (`* text=auto eol=lf`): hết diff rác do line ending.
- `docs/sdd/spec-first-vs-code-first.md`: bảng tiêu chí + áp dụng cho 4 việc của GameHub.
- Scaffold pnpm + Turborepo: `packages/typescript-config` (strict), `packages/eslint-config` (`max-lines-per-function: 60`, `max-lines: 400`), 4 test Vitest kiểm guardrail ở cả hai phía của biên (60/61 dòng, 400/401 dòng).
- Checkpoint: `pnpm turbo run lint check-types test` → 3 task thật chạy, 4 test pass.

### Quyết định và vì sao
- **Bộ luật cơ bản thay vì đủ 5 nhóm của guide**: chỉ đưa vào luật mà lỗi đắt / không sửa lại được, hoặc lỗi lộ ra rất muộn. Luật khác thêm theo **Growth rule** (lỗi gặp 2 lần trong review hoặc phải dặn AI 2 lần → thành luật, ưu tiên lint/CI, bump MINOR).
- **Luật máy kiểm được nằm trong ESLint config, không nằm trong constitution** (`max-lines-*`). Constitution chỉ giữ nguyên tắc cần hiểu lý do.
- **Xoá mục "Development Workflow" AI tự thêm**: lặp lại 5 principle dưới dạng checklist → sửa một luật phải sửa 2 chỗ. Checklist cho PR sẽ nằm trong `pull_request_template.md` (Module 2).
- **Version spec qua `CLAUDE.md`, không override template**: `CLAUDE.md` giúp *sinh đúng*, `/speckit-analyze` (sau này `spec-lint`) *phát hiện sai*. Nếu AI vẫn hay quên → chuyển sang `.specify/templates/overrides/spec-template.md`.
- **Test-first chỉ cho logic** (gameplay, session/contracts, SDK lifecycle, tools); UI chỉ để trình bày được test sau. Mọi FR vẫn phải có test gắn tag trước merge.
- **Đổi spec giữa chừng** (đã thống nhất, chưa đưa vào constitution): MINOR/PATCH → sửa plan/tasks có chọn lọc theo diff của spec rồi `/speckit-analyze`; MAJOR → commit trước rồi mới chạy lại plan. Task mới lấy ID mới, không đánh số lại.
- **Bỏ `no-explicit-any`**: lý do: KHÔNG CẦN THIẾT HIỆN TẠI. Cái giá: `strict` chỉ chặn `any` ngầm; `any` tường minh chỉ còn review chặn.
- **Hoãn ngân sách bundle/FPS tới Module 6** (bản MINOR khi có `size-limit` và bundle thật để đo). "Game chỉ gọi server qua session" hoãn tới khi có package session (Module 5).
- **Template game là một app trong `apps/`**; script generate game clone từ app đó. Là quyết định kiến trúc: ghi vào `plan.md` của feature template/generator, kèm phương án đã cân nhắc là `packages/`.
- **Script generate game cần spec** dù là công cụ nội bộ: lỗi của nó nhân bản sang mọi game mới.

### Mỗi principle chặn lỗi gì

| Principle | Loại lỗi nó chặn | Có thể tự động hoá khi nào |
|---|---|---|
| I. Spec-First | Code sinh ra không đúng yêu cầu | PR phải link spec (M2), `spec-lint` (M3) |
| II. Humans Decide | AI tự merge code lỗi vào main | branch protection, CODEOWNERS, AI trong CI chỉ có quyền `contents: read` (M2) |
| III. Verified | Test chỉ xác nhận lại code AI, kể cả chỗ sai; FR bị bỏ sót mà không ai biết | `spec-trace` (coverage, M3); "đã thấy fail" vẫn kiểm bằng người |
| IV. Simplicity | Phantom package (AI bịa ra package không tồn tại), rủi ro supply chain, abstraction thừa | `guard-deps` cho dependency (M2). Abstraction thừa thì luôn cần người đánh giá |
| V. No Secrets | Lộ token hay PII, không thu hồi được | `gitleaks` cho secret (M2), contract test cho telemetry (M13) |

### Vấp ở đâu
- **Prompt chặn principle nhưng không chặn section**: AI lấp placeholder `SECTION_3` của template thành mục "Development Workflow".
- **Constitution đòi Version cho spec nhưng `spec-template.md` không có trường Version.** Bài học: viết luật xong phải kiểm template/công cụ có cho phép tuân thủ không. Phát hiện thêm: `/speckit-specify` **không đọc constitution**, chỉ `/speckit-analyze` đọc.
- **Chỗ hở của Principle IV**: lý do dependency phải ghi trong plan, nhưng thay đổi hạ tầng được miễn spec thì không có plan → sửa thành 1.1.0.
- **`create-turbo` kéo theo rác**: `packages/ui`, config Next.js/React, README starter, và `eslint-plugin-only-warn` hạ mọi lỗi thành cảnh báo (guardrail chỉ còn tác dụng nhờ cờ `--max-warnings 0`).
- **Checkpoint có thể xanh mà không chạy gì**: khi chưa package nào có script, `turbo run` không có task nào nhưng vẫn báo thành công. Phải xác nhận trong output có task thật được chạy.
- **Test "allows" dùng `.not.toContain` xanh trên tập rỗng** (file không được lint thì cũng pass) → đổi sang `toEqual([])`.
- **Mất bằng chứng red → green**: gỡ `only-warn` trước khi viết test. Thay bằng kiểm mutation: đổi input của test "allows" từ 60 → 61 và 400 → 401 thì test đỏ, rồi khôi phục.
- Line ending: 5 file JSON trong `.specify/` bị đánh dấu sửa đổi dù nội dung không đổi (LF ↔ CRLF trên Windows).

### Soundbite phỏng vấn (Q10)
> Tôi tách hai thứ: AI làm việc trong khung, con người sở hữu cái khung. Khung là constitution có version: AI được soạn spec, plan, code khi được yêu cầu, nhưng không được approve, merge hay sửa constitution. Khi tạo constitution, AI tự thêm một mục tôi không yêu cầu, tôi bỏ đi. Khi dựng scaffold, tôi phát hiện luật về dependency bị hở với thay đổi hạ tầng không có plan, nên sửa constitution từ 1.0.1 lên 1.1.0. Lỗi gặp hai lần trong review thì thành luật, ưu tiên lint hoặc CI.

### Soundbite phỏng vấn (Q9)
> Tiêu chí của tôi: ai dùng, sai thì mất gì, bao nhiêu thứ phụ thuộc, có dễ sửa lại không. Ví dụ ở ranh giới: script generate game là công cụ nội bộ nhưng vẫn cần spec, vì lỗi của nó nhân bản sang mọi game mới. Còn CI thì code-first, vì không có hành vi người dùng và pipeline tự kiểm chính nó (`docs/sdd/spec-first-vs-code-first.md`).

---

## Module 2 — CI/CD nền bằng GitHub Actions (2026-11-05)

### Đã làm gì
- `.github/workflows/pr.yml` (PR #1), 3 job:
  - `verify`: `pnpm turbo run lint check-types test` (thêm `--continue` ở PR #6);
  - `secrets`: gitleaks trên mọi commit của PR;
  - `guard-deps`: lockfile đổi mà thiếu label `deps-approved` → fail.
- `.github/CODEOWNERS` + `.github/pull_request_template.md` (PR #2). Template có checklist theo 5 principle và mục *AI assistance*.
- Ruleset trên `main`: bắt buộc qua PR, bắt buộc 3 check xanh.
- 3 PR phá cố ý, **giao cho 3 agent Claude Code chạy song song**, mỗi agent một git worktree, prompt có kết quả dự kiến và giới hạn (không merge, không đóng PR, không sửa file ngoài phạm vi). Kết quả:

  | PR | Gate | Kết quả |
  |---|---|---|
  | A (#4): thêm `picocolors` | `guard-deps` | Đỏ, `APPROVED: false`, merge `BLOCKED`. Có label `deps-approved` → chạy lại, xanh |
  | B (#3): token giả `ghp_…`, rồi xoá ở commit sau | `secrets` | Đỏ, `github-pat` ở commit thêm token, dù diff cuối không còn token |
  | C (#5): hàm 61 dòng | `verify` → lint | Đỏ, đúng 1 lỗi `max-lines-per-function`, merge `BLOCKED` |
- `docs/sdd/ci.md`: mỗi gate chặn gì, principle nào, bằng chứng; 7 quyết định thiết kế; hạn chế đã biết.

### Quyết định và vì sao
- **Gate tất định trước, AI sau.** Code AI và code người viết qua cùng một `pr.yml`. Bước AI review (nếu có) chỉ comment, không bao giờ là gate.
- **Quyền tối thiểu:** mặc định `contents: read`; `secrets` thêm `pull-requests: read`; tắt comment của gitleaks để không job nào cần quyền ghi.
- **Ghim action theo commit SHA**, tag để trong comment: tag có thể bị dời sang code khác (vụ `tj-actions/changed-files`, 03/2025), SHA thì không. Annotated tag phải lấy SHA của commit, không lấy SHA của đối tượng tag.
- **Dữ liệu PR đi qua `env`**, không chèn `${{ }}` vào `run:` (chống script injection).
- **Không path filter cấp workflow:** check bắt buộc không bao giờ báo kết quả → PR kẹt. `if:` cấp job thì khác: job skipped được tính là đạt.
- **Chưa `--filter=...[origin/main]`** (1 package), **chưa `pnpm audit`** (advisory mới làm PR fail dù PR không đổi gì → nên chạy theo lịch).
- **Chưa bật required Code Owner review:** làm một mình thì tác giả không tự approve được. Bật khi AI mở PR (tác giả là bot, rule có tác dụng thật).
- **AI review:** gói Pro dùng được (`claude setup-token` → secret `CLAUDE_CODE_OAUTH_TOKEN`), nhưng dùng chung hạn mức. Hoãn; khi làm thì chỉ chạy với label `ai-review`, không chạy cho PR từ fork.

### Vấp ở đâu / phát hiện
- **Agent A dừng vì label chưa tồn tại** (bước chuẩn bị bị bỏ sót). Đúng hành vi: prompt cấm tạo label, agent hỏi xin phép thay vì tự lách.
- **Lint fail che mất test:** mặc định turbo dừng khi một task fail → thêm `--continue` (PR #6). Phát hiện nhờ agent C ghi rõ phần nó *chưa* kiểm.
- **Gitleaks chạy sau khi push:** lúc nó đỏ, secret đã ở trên GitHub, phải rotate. Push protection của GitHub không chặn token giả. Cần lớp chặn trước: push protection hoặc pre-commit hook.
- **Gitleaks in email tác giả commit vào log CI** (token thì đã được che). Log Actions của repo public cũng public.
- `guard-deps` vẫn bắt được dù `picocolors` đã có sẵn trong lockfile (dependency gián tiếp): gate chặn mọi thay đổi lockfile, không chỉ package mới.

### Soundbite phỏng vấn (Q6)
> Code do AI sinh đi qua đúng bộ gate với code người viết, trong một workflow duy nhất: lint (giới hạn 60 dòng mỗi hàm, 400 dòng mỗi file), type-check, test, gitleaks, và một gate buộc người duyệt mỗi khi lockfile đổi. Mỗi gate được chứng minh bằng một PR cố tình phá. Tôi giao 3 PR đó cho 3 agent chạy song song, rồi tự đọc log để xác nhận từng gate đỏ đúng lý do. Chính quá trình đó lộ ra hai lỗ hổng mà tôi đã sửa hoặc ghi lại: lint fail che mất test, và secret chỉ bị bắt sau khi đã push.

---

## Module 3 — Feature 001: `spec-diff` (đang làm, 2026-11-05 → )

### Đã làm gì
- **Lần 1 (bỏ):** feature `spec-tooling` gồm 3 tool (`spec-lint`, `spec-trace`, `spec-diff`). Sau specify và vài lượt clarify, spec phình ra 20 FR, kèm nhiều luật version (quy ước `redefined`/`wording`, luật riêng cho 0.x, L6 kiểm Status). Reset branch về `main`, làm lại.
- **Lần 2:** feature `001-spec-diff`, chỉ một tool: so 2 file spec (bản cũ, bản mới), báo version cũ → mới và FR/SC thêm/xoá/sửa, **một luật duy nhất**: nội dung đổi mà version không đổi → lỗi.
  - specify (3 câu hỏi) → clarify (3 câu) → spec **1.0.0 Approved**.
  - plan: `research.md` có 5 quyết định, mỗi quyết định ≥ 2 phương án.
  - tasks: 39 task, 6 phase; analyze 2 lượt (lượt 1: 3 CRITICAL, lượt 2: 0 CRITICAL).
  - implement lần chạy 1 (Phase 1–3, T001–T019): **xong**. 5 commit `test(red)` (T010–T013) đứng trước 4 commit `feat(green)` (T015–T018); commit T014 ghi "31/31 test fail on behavior"; commit red chỉ chứa test (ví dụ T010: chỉ `diff.parse.test.ts` + `tasks.md`). Thêm 2 cặp red/green sửa `eslint-config` chen giữa. Code: khoảng 190 dòng nguồn (`diff.ts`, `format.ts`, `cli.ts`) và 615 dòng test.
  - implement lần chạy 2 (Phase 4–6, T020–T038): **xong**, 19 commit, 39/39 task `[X]`. US2: 14 test đỏ (31 test US1 vẫn xanh) trước 4 commit green; US3: 8 test đỏ trước 2 commit green. Gate toàn repo: 6/6 task turbo, 53/53 test của spec-diff, 6/6 của eslint-config. 24 case `diffSpecs` (SC-001 cần ≥ 10), FR-001..FR-012 đều có tag.
  - **PR #8 đã merge** vào `main`, spec 1.0.1 Implemented. Bước tự kiểm bằng tool (so spec với commit approve `3121ec4`) bị bỏ qua trước khi merge, làm bù sau merge, giao cho AI với prompt chỉ đọc (không sửa, không commit; sai kỳ vọng thì dừng và phân loại lỗi tool hay lỗi môi trường): **3/3 PASS**. (1) 1.0.0 → 1.0.1, không FR/SC nào đổi, exit 0. (2) bản giả chỉ đổi Status, giữ 1.0.0 → `version-not-bumped`, exit 1. (3) như (2) với `--json` → JSON hợp lệ, `result: rule-violation`, exit 1. AI kiểm 3 byte đầu của file để chắc không có BOM.
- `CLAUDE.md` thêm **luật 2**: test so toàn bộ giá trị kỳ vọng; test pass trên stub hoặc kết quả rỗng không chứng minh gì.

### Quyết định và vì sao
- **Thu nhỏ phạm vi còn 1 tool, 1 luật.** Mức bump (MAJOR/MINOR/PATCH) và chiều bump do người quyết, tool không đoán (Principle II).
- **Luật version giữ như trên `main`** (0.1.0 → 1.0.0 khi duyệt, mỗi thay đổi đều bump). Không thêm luật cho giai đoạn Draft. Spec 001 đi qua 0.1.0 → 0.5.0 → 1.0.0.
- **Input là 2 đường dẫn file**, việc lấy bản cũ từ git (`git show`) để bên gọi lo. Lõi so sánh là hàm thuần nhận 2 chuỗi, nên test không cần dựng repo git giả (chậm, phụ thuộc môi trường, dễ flaky).
- **Clarify:**
  - version giảm: chấp nhận (người quyết);
  - chỉ đổi khoảng trắng/xuống dòng: không tính là thay đổi;
  - spec mới (không có bản cũ): ngoài phạm vi, CI tự bỏ qua;
  - report chỉ ghi ID, không ghi nội dung;
  - 3 kết quả riêng: pass / vi phạm luật / lỗi input, mỗi kết quả một exit code;
  - báo mọi lỗi trong một lần chạy.
- **Plan:**
  - đọc Markdown theo từng dòng bằng regex, không dùng parser;
  - output máy đọc được là JSON có `schemaVersion`;
  - chạy thẳng TypeScript bằng Node 24, không build;
  - exit code 0/1/2, lỗi bất ngờ cũng thoát mã 2.
- **Thêm `specs/` vào `.prettierignore`** (thay đổi hạ tầng riêng): Prettier không chỉ đổi khoảng trắng mà còn đổi `*` thành `-` và `*(x)*` thành `_(x)_`.
- **Status đổi thành Implemented ngay trong PR của code** (bump PATCH 1.0.1), không đợi merge xong mới mở PR khác: khi PR merge, `main` có code và spec khớp nhau ngay, không có khoảng thời gian spec ghi Approved trong khi code đã có; bớt một PR.
- **Chạy implement 2 lần thay vì 6** (gộp Phase 1–3, rồi 4–6). Vẫn giữ US3 (JSON).
- **Điểm dừng cho analyze:** tối đa 2 lượt; sửa CRITICAL và lỗi chặn việc implement; phần còn lại để review trên code thật.
- **Lint của TypeScript** (parser của Babel không hiểu kiểu):
  - tắt `no-undef` cho file TS (`tsc` đã kiểm tên chưa định nghĩa);
  - tắt `no-unused-vars` cho file TS và bật `noUnusedLocals`/`noUnusedParameters` trong `@repo/typescript-config` (chuyển việc kiểm sang `tsc`);
  - cả hai làm test-first; nếu rule thứ ba báo sai thì dừng và xem lại cách làm.
  - Không chuyển sang `typescript-eslint` được: bản mới nhất (8.72.1, cả canary) chỉ hỗ trợ TypeScript `<6.1.0`, repo dùng 7.0.2. Hướng sau này: đợi bản hỗ trợ TS 7, hoặc hạ TypeScript xuống 6.0.x.
  - `no-explicit-any` vẫn tắt (quyết định ở Module 1).

### Vấp ở đâu / phát hiện
- **Lần 1 phình vì cứ thêm luật để vá luật:** sửa luật version ở `CLAUDE.md` làm lộ chỗ trống ở spec của tool kiểm nó (0.x, Status), rồi lại thêm luật. Bài học: giữ luật đơn giản, để người quyết những gì máy không cần đoán.
- **`/speckit-specify` tự hỏi tối đa 3 câu** cho marker nó để lại; `/speckit-clarify` là bước khác, quét toàn spec (tối đa 5 câu).
- **AI khuyên bỏ qua clarify** vì "không còn marker". Sai: không còn marker không có nghĩa là không còn chỗ mơ hồ. Clarify sau đó hỏi thêm 3 câu thật.
- **AI tự thêm yêu cầu, có khai, nhưng vẫn là thêm** (lần 2 trở lên): ID trùng là lỗi, test `skip` không tính, Status thiếu là lỗi… Cần đọc kỹ phần Assumptions và từng phương án, không chỉ đọc tiêu đề.
- **AI để lọt chỗ nó không tự nhận ra:** SC không đo được ("người review hiểu trong 1 phút"), SC nằm ngoài phạm vi (gắn vào CI), trích sai nguồn của luật.
- **Giả định bị thực tế bác bỏ:** chọn "bỏ qua khoảng trắng" vì nghĩ Prettier chỉ đổi khoảng trắng. AI chạy thử `pnpm format` và thấy sai.
- **Analyze lần 1: 3 CRITICAL đều là test pass sẵn trên stub** (chỉ kiểm "không có gì"). Đây là **lần thứ ba** gặp lỗi "assertion trên tập rỗng" (TripDesk, Module 1, giờ) → Growth rule → luật 2 trong `CLAUDE.md`. Analyze lần 2 bắt được ngay các task vi phạm luật mới.
- **Analyze lặp lại thì `tasks.md` cứ phình:** task bắt đầu chứa chi tiết của code test (thứ tự lỗi, thứ tự trường JSON). Analyze luôn tìm được thêm thứ để góp ý.
- **Spec-first quá tay cho công cụ nội bộ:** spec 134 dòng + khoảng 370 dòng plan/research/contract + 39 task cho khoảng 3 file nguồn. Theo bảng tiêu chí của chính mình, `spec-diff` nghiêng về code-first; chỉ output JSON (có chương trình khác đọc) là cần contract trước. Lý do thật để chạy đủ vòng là để học.
- **Quyết định ở Module 1 trả giá ở Module 3:** bỏ `typescript-eslint` → parser của Babel → 2 rule báo sai trên file TypeScript đầu tiên có khai báo kiểu. Bộ test guardrail ở Module 1 không bắt được vì chỉ lint code không có kiểu: test guardrail cần cả code hợp lệ giống code thật.
- **Giới hạn trong prompt có tác dụng:** AI dừng lại xin phép khi phải sửa lint rule, và không tự suy rộng (*"your approval covered only no-undef"*). AI cũng kiểm tương thích `typescript-eslint` trước khi cài, kể cả các bản canary/rc.

- **Kịch bản tay số 8 (so với `main`) không chạy được thật:** spec chưa có trên `main`, nên `git show` không lấy được bản cũ và tool báo `missing-version`, exit 2. Đây đúng là trường hợp "spec mới" mà clarify đã để bên gọi tự bỏ qua; việc tách exit code "lỗi input" (2) khỏi "vi phạm luật" (1) giúp phân biệt ngay đây là lỗi cấu hình của bên gọi, không phải lỗi của spec. Bước CI sau này phải kiểm file có tồn tại trên `main` trước khi gọi tool.
- **AI báo rõ phần chưa kiểm:** kịch bản 8, và việc chưa chạy Prettier trên code. Giả định của nó (vẫn báo Version của file đọc được khi có lỗi input, so output không phải JSON dưới dạng chuỗi…) đều nằm trong phạm vi contract.

- **Windows PowerShell 5.1 làm hỏng file khi lấy bản cũ:** `>` ghi UTF-16, `Out-File -Encoding utf8` thêm BOM, `utf8NoBOM` chỉ có từ PowerShell 7. Dùng `cmd /c "git show ... > file"` để giữ nguyên từng byte. Tool chưa xử lý BOM (spec không nói tới); BOM ở đầu một file có thể làm tool báo nhầm "content changed". Gợi ý cho bản sau.
- **Checklist trong PR template không chặn được việc bỏ qua bước kiểm tay:** PR #8 merge trước khi chạy tool trên chính spec của nó. Bước nào không được bỏ qua thì nên thành job CI (ví dụ chạy `spec-diff` trên các spec có thay đổi).

### Soundbite phỏng vấn
> **Q9:** Tôi từng chạy đủ vòng spec-first cho một CLI nội bộ so hai file spec: hơn 500 dòng tài liệu và 39 task cho khoảng 3 file nguồn. Theo bảng tiêu chí của tôi (ai dùng, sai thì mất gì, bao nhiêu thứ phụ thuộc, dễ sửa không), đó là việc nên code-first; phần duy nhất cần cố định trước là định dạng JSON vì một bước AI khác sẽ đọc nó. Giờ tôi chọn mức quy trình theo rủi ro.

> **Q6/Q13:** Khi một guardrail báo sai, tôi không vá bừa. Tôi tìm nguyên nhân gốc (parser của ESLint không hiểu kiểu TypeScript), kiểm tương thích trước khi đổi công cụ, và khi không đổi được thì chuyển việc kiểm sang `tsc`, làm test-first. Không lớp kiểm nào bị mất. Lỗi "test pass trên tập rỗng" gặp lần thứ ba thì tôi biến thành luật, và công cụ kiểm nhất quán áp luật đó ngay lần sau.

---

## Phần 2 (lộ trình rút gọn) — `spec-diff` trong CI và bước AI `spec-impact` (đang làm, 2026-11-06)

### Đã làm gì
- **2a:** thêm job `spec-diff` vào `.github/workflows/pr.yml`: với mỗi `specs/*/spec.md` bị sửa trong PR, lấy bản trên base bằng `git show`, chạy `spec-diff`; spec nào exit khác 0 thì job đỏ.
  - PR #10 (`ci/spec-diff-gate`, không sửa spec): job in "No spec changed." và xanh.
  - PR phá cố ý #11 (`ci/spec-diff-gate-failure`): sửa một FR trong spec 001, giữ Version 1.0.1 → job đỏ, `version-not-bumped`. Đóng, không merge.
  - `docs/sdd/ci.md`: thêm dòng `spec-diff` vào bảng Gates; ruleset giờ yêu cầu 4 check.
  - Job `spec version check (spec-diff)` đã được thêm vào required checks của ruleset.
- **2b (đang làm):** `.github/workflows/spec-impact.yml` + `prompts/spec-impact@v1.md`. Chạy lại `spec-diff --json` cho các spec bị sửa, rồi `claude-code-action` (OAuth token của gói Pro) đọc JSON, 2 bản spec và repo, đăng **một** comment: ID nào đổi nghĩa ra sao, file/test nào có thể bị ảnh hưởng, câu hỏi cho người review.

### Quyết định và vì sao
- **Hai lớp:** gate tất định (2a, chặn merge) trước; bước AI (2b, chỉ comment) sau và dùng output của 2a.
- **2a là một job trong `pr.yml`**, không phải workflow riêng có `paths:` (bài học Module 2: check bắt buộc của workflow không chạy sẽ chờ mãi). PR không sửa spec thì job in "No spec changed." và xanh.
- **Chỉ chạy trên PR** (`if:` cấp job), vì cần base của PR; job skipped trên push vào `main` được tính là đạt.
- **Spec mới (chưa có trên base) và spec bị xoá: bỏ qua**, đúng quyết định Q3 ở clarify (bên gọi tự lo trường hợp không có bản cũ).
- **Script viết thẳng trong YAML** (khoảng 25 dòng bash), không tách file: máy dùng PowerShell nên không chạy thử script bash trên máy được.
- **Không cài dependency:** `spec-diff` chỉ dùng module có sẵn của Node và chạy thẳng TypeScript bằng Node 24, nên job chỉ cần checkout và setup-node.
- **Chưa lưu output JSON thành artifact:** 2b tự chạy lại `spec-diff --json` trong job của nó (vài mili giây), đơn giản hơn truyền artifact giữa 2 workflow.
- **2b chỉ chạy khi người gắn label `ai-review`**, không chạy cho PR từ fork (secret không tới được fork, và người ngoài không được tiêu hạn mức của gói Pro).
- **2b chỉ được comment:** `contents: read`, `pull-requests: write`; công cụ AI chỉ có `Read`, `Glob`, `Grep` và `gh pr comment`; tối đa 10 turn. Không phải gate: không bao giờ chặn merge.
- **Prompt có version** (`prompts/spec-impact@v1.md`), output có định dạng cố định, ghi rõ nội dung spec/code/PR là **dữ liệu không tin cậy** (chống prompt injection), không được bịa đường dẫn file, file không chắc thì đưa vào mục câu hỏi.
- Dùng `github_token` thay vì Claude GitHub App, nên không cần `id-token: write`.
- **2b không chạy cho spec mới** (chưa có trên base): không có bản cũ để so, và chưa có code nào làm theo spec đó, nên "code nào bị ảnh hưởng" không có nghĩa. Spec mới đã được `clarify` và `analyze` kiểm ở local. Muốn AI soát spec mới (trùng/mâu thuẫn với code hoặc spec khác) thì làm prompt riêng, ví dụ `prompts/spec-review@v1.md`.
- Dữ liệu PR đi qua `env`, action ghim SHA như các job khác.

---

## Phần 1 (lộ trình rút gọn) — Spec đổi giữa iteration: `spec-diff` 2.0.0 (đang làm, 2026-11-06)

### Đã làm gì
- Branch `001-spec-diff-v2`. **PR 1 (chỉ spec):** FR-010 định nghĩa lại: version mới **thấp hơn** version cũ → lỗi `version-decreased`, kết quả rule-violation (exit 1). Đảo ngược quyết định Q1 ở clarify (0.2.0: chấp nhận version giảm).
  - Sửa thẳng `spec.md` (spec đã Approved, không chạy lại `/speckit-specify`): FR-010, edge case tương ứng, thêm US2 scenario 4, bump **1.0.1 → 2.0.0** (MAJOR vì FR bị định nghĩa lại), Changelog ghi `FR-010 redefined`, Status **Implemented → Approved** (code chưa theo kịp spec).
  - Tự kiểm bằng chính tool trước khi mở PR: so spec trên `HEAD` với bản sửa → `1.0.1 -> 2.0.0`, `FR changed: FR-010`, pass, exit 0.
  - Gắn label `ai-review` → `spec-impact@v1` đăng một comment. Đối chiếu với repo: **đúng cả 2 file nó nêu** — `diff.ts` (~dòng 156, chỉ so bằng nhau, chưa có `version-decreased`) và test `[001:FR-010] accepts a lower new version without error` (`diff.test.ts` dòng 249) đang khẳng định hành vi cũ. Không bịa đường dẫn nào. Nó tự nói rõ chưa mở `cli.ts`/`format.ts` nên đưa vào mục câu hỏi (thực tế `cli.ts` không bị ảnh hưởng: exit code ánh xạ theo kết quả, rule-violation đã là 1). Hỏi đúng: chưa có test cho US2 scenario 4.
  - **AI bỏ sót tài liệu thiết kế:** `contracts/cli.md` (bảng mã lỗi) và `data-model.md` (union `code` và luồng quyết định) đều phải thêm `version-decreased`. Nguyên nhân: prompt v1 chỉ bảo tìm "code and tests". Ứng viên cho `spec-impact@v2`: thêm các tài liệu trong `specs/NNN-*/` (plan, data-model, contracts) vào phạm vi tìm.

- **PR 2 (code)**, branch `001-spec-diff-v2-impl`, prompt dùng chính comment của `spec-impact` cộng phần nó bỏ sót:
  - cập nhật **có chọn lọc** `contracts/cli.md` và `data-model.md` (thêm `version-decreased`); `plan.md` không đổi; nối Phase 7 (T039–T044) vào `tasks.md`, không đụng task cũ;
  - red (`e4bb2ec`): sửa test cũ của FR-010 sang hành vi mới, thêm test cho US2 scenario 4, thêm test `1.10.0 → 1.9.0` là giảm (so theo số, không theo chuỗi); 3 test đỏ, 52 test khác xanh;
  - green (`913de0e`): thêm mã lỗi, hàm so semver và phép kiểm trong `diff.ts`; gate 6/6, **55/55 test**;
  - spec (`ab1beb4`): Status → Implemented, **2.0.1**; tự kiểm bằng tool: 2.0.0 → 2.0.1 pass, đảo ngược 2 file → `version-decreased`, exit 1.
  - AI tự khai chưa làm: chưa có test CLI cho exit 1 khi version giảm (exit code ánh xạ theo kết quả, đã được test); `quickstart.md` chưa có kịch bản tay; header các tài liệu thiết kế vẫn ghi spec 2.0.0; commit red không qua được type-check (bình thường với TDD, CI chỉ chạy trên đầu PR).

### Quyết định và vì sao
- **Không phải thay đổi spec nào cũng cần 2 PR + AI review.** Mặc định: một PR, commit spec đứng trước commit code, gate `spec-diff` vẫn chạy. Tách 2 PR khi thay đổi là MAJOR hoặc cần người khác (PO) duyệt yêu cầu trước khi làm. Label `ai-review` là tuỳ chọn, dùng khi không chắc phạm vi ảnh hưởng.
- **Chọn một thay đổi MAJOR làm test cũ phải sửa** (thay vì thêm FR mới như xử lý BOM): đây là trường hợp `spec-impact` có việc thật để làm, và là đúng câu hỏi Q4 (code và test có bám theo spec đã đổi không).
- **Tách PR spec và PR code**: PR spec được review như một quyết định (có nên đổi yêu cầu không); PR code như việc thực thi. AI không thể lặng lẽ sửa spec cho khớp code nó viết.
- **Status quay về Approved** trong PR spec, và lên Implemented (bump PATCH) trong PR code.

---

## Phần 3 — Nền tảng game theo GameHub cũ: core → template → gen-game → storybook (bắt đầu 2026-11-09)

### Bối cảnh
- Đã có pipeline `issue-to-pr`: issue có label `ai-build` → Spec Kit (specify → plan → tasks → analyze → implement) → vòng review/fix (tối đa 3, reviewer là phiên riêng chỉ đọc) → PR → tag người duyệt. AI không push (không thấy token), không merge.
- Đối chiếu với GameHub cũ (`ecom-game-hub`): React 19 + Vite 7; `packages/core` (GameContext, adapter Local/Remote, client HTTP, ký request WASM, hook); API `/{gameId}/v1/init`, `/me`, `/reward`, `/nonce`; template `scratch-card-example` (`App`, `GameSDK` với `init`/`destroy` + Shadow DOM + biến toàn cục `window.<Tên>SDK`, `Game`; 2 cấu hình Vite: chạy độc lập và build SDK IIFE); `gen-game` copy template rồi đổi tên package; Storybook tải SDK từ CDN theo version (`releases.json` mỗi game).
- **Chỗ trôi của template cũ (bị `gen-game` nhân bản sang mọi game):** `check-types` gọi `next typegen` dù không dùng Next.js; tên biến toàn cục trong cấu hình build (`ScratchCardSDK`) lệch tên gán thật (`ScratchCardExampleSDK`); `gameId` mặc định lệch dữ liệu mock; README của Next.js; `tsconfig.tsbuildinfo` bị copy theo; adapter đọc `response?.data?.data` không validate; không có test tự động.

### Quyết định và vì sao
- **Thứ tự:** 002 `game-core` tối thiểu → 003 template `scratch-card-example` → 004 `gen-game` → 005 Storybook → sau đó tạo game hàng loạt qua GitHub issue.
- **`core` giữ thành package riêng** như bản cũ: mọi game dùng chung.
- **Pipeline cho phép AI thêm dependency**, người review gắn label `deps-approved` (gate `guard-deps` vẫn chặn nếu thiếu label).
- **Stack:** React + Vite, **bỏ styled-components**; dùng **`fetch` có sẵn** thay axios (bớt dependency, dễ test bằng `fetch` giả); **thêm thư viện test cho component React** (Testing Library + môi trường DOM).
- **Playwright để sau.** Đã cân nhắc: chỉ nó kiểm được bundle SDK thật (biến toàn cục `window.<Tên>SDK`, Shadow DOM, CSS không lọt, canvas), và nếu đặt trong template thì mọi game sinh ra tự kiểm được chính nó. Hoãn vì chưa cần cho `game-core`.
- **002 `game-core` làm qua GitHub issue** (pipeline `issue-to-pr`), không chạy Spec Kit bằng tay. Issue không nhắc tới GameHub cũ (repo cá nhân, viết lại độc lập). Issue ghi rõ: lý do (mọi game cần chung một client đã được test, response phải được validate); contract với backend có sẵn (endpoint, header `X-Access-Token`, response `{ data }`, 401 trả về như một lỗi bình thường, **không refresh token**); luật PO; hành vi phải giữ (validate, lỗi mạng/5xx/không phải JSON thành lỗi, token không log); out of scope chỉ 2 dòng (refresh/retry/cache; template và UI); dependency được phép.
- **Tiêu chí cho mục Out of scope:** mỗi dòng phải trả lời được "nếu không ghi, người đọc (AI) có tự làm thứ này không?". Bản nháp đầu liệt kê tính năng của GameHub cũ (captcha, leaderboard, âm thanh…) mà repo và issue không hề nhắc tới: vừa thiếu ngữ cảnh, vừa có thể gợi ý cho AI. Thứ AI hay tự thêm với một HTTP client có xác thực là refresh token, retry, cache, nên ghi rõ những thứ đó. Lý do: những gì đã biết chắc phải ghi ra, vì prompt `build` chỉ cho tối đa 3 giả định và AI tự thiết kế API sẽ không khớp server thật.
- **002 `game-core` xong** qua pipeline: issue #18 → PR #22 (spec 1.0.0 Implemented).
- **003 template `scratch-card-example` (issue):** Why nhấn mạnh "mọi thứ trong template sẽ có trong mọi game"; SDK contract ghi chi tiết (global `window.ScratchCardExampleSDK`, `init(container, config)`/`destroy()`, Shadow DOM có style riêng, init 2 lần thì thay game cũ, container không tồn tại thì báo lỗi rõ); **tên game, tên package, tên global định nghĩa ở một chỗ** để `gen-game` đổi tên một lần; gameplay cụ thể (cào ≥ 50% → `submitResult(1)`, 3 sự kiện tracking, tiến độ cào là hàm thuần vì happy-dom không có canvas); behaviour phải giữ (tên global trong file build khớp, không commit `dist/`/`*.tsbuildinfo`, README đúng template, token không log); out of scope 4 dòng (Playwright, art/âm thanh, generator/Storybook, môi trường ngoài dev/production).
- **Lỗ hổng CI phát hiện khi viết issue 003:** `pr.yml` chỉ chạy `lint check-types test`, không chạy `build`/`buildSdk`, nên SDK build lỗi vẫn xanh. AI không được sửa `.github/`, nên người phải thêm gate này (nên làm trước issue 003; `gen-game` cũng cần nó).
- **Storybook cần `buildSdk`, không cần `build`** (trang chạy độc lập): Storybook nhúng game giống app chủ, tức là tải file SDK. Gate CI cần cho `buildSdk`.
- **Không commit file build.** Storybook build SDK của các game ngay lúc build, qua `dependsOn` của Turborepo (`pnpm turbo run build --filter=storybook`); deploy chạy đúng lệnh đó. Lý do: diff rác, file build lệch với code, và mâu thuẫn với luật "không commit `dist/`" của template. Nhiều version (như bản có CDN) thì dùng GitHub Releases, `releases.json` chỉ lưu URL; bắt đầu với chỉ version hiện tại.
- **Bỏ script `build` (trang chạy độc lập) khỏi template**: Storybook và app chủ chỉ cần `buildSdk`; `dev` đủ để chạy độc lập trên máy. Issue 003: bỏ `build` khỏi mục Scripts, thêm vào Out of scope "a standalone production build of the dev page".
- **Gate `buildSdk` (PR của người, vì `.github/` cấm AI sửa):** thêm task `buildSdk` vào `turbo.json` (trước đó chưa khai báo, turbo sẽ báo lỗi), job `verify` chạy `lint check-types test buildSdk --continue`, cập nhật `ci.md`. **Hạn chế:** chưa package nào có `buildSdk`, nên gate xanh mà không build gì cho tới khi template 003 merge; prompt bắt AI chạy `--dry-run` để thấy số package được build (0) và ghi hạn chế vào `ci.md`. Chứng minh thật sau 003 bằng một PR phá cố ý (entry của cấu hình build SDK trỏ tới file không tồn tại).
- **003 template xong** qua pipeline: issue #25 → PR #26. Tên chỉ có một nguồn là `name` trong `package.json` (`src/game-name.ts` tính game id, tên global, tên file build); tên template chỉ còn trong README và test (test hygiene cho phép đúng các chỗ này).
- **004 `gen-game` (issue):** package `packages/gen-game` (để turbo chạy test trong CI), CLI `pnpm gen-game <name>`; từ chối tên sai/trùng; không copy `node_modules`/`dist`/`.turbo`/`*.tsbuildinfo`; thay **cả 2 dạng tên** (kebab và `PascalSDK`) ở đúng các file chứa tên (`package.json`, README, test); không ghi đè, thất bại giữa chừng thì xoá thư mục dở; game sinh ra qua `lint check-types test buildSdk` mà không sửa gì; giữ tag `[003:FR-###]` trong test được copy (kiểm hợp đồng template); không tạo spec (pipeline đã tạo); lõi nhận thư mục làm tham số để test trên thư mục tạm.
- **Vấn đề `guard-deps` cho game hàng loạt:** mỗi game mới làm lockfile đổi (thêm importer cho workspace mới) dù không thêm dependency, nên mọi PR game bị chặn tới khi gắn `deps-approved`. Lựa chọn: chấp nhận gắn label tay, hoặc sửa `guard-deps` chỉ chặn khi danh sách package bên ngoài trong lockfile đổi (PR của người).
- **004 `gen-game` xong** qua pipeline: issue #28 → PR #29.
- **Game đầu tiên `flappy-bird` (issue):** "How to start" bắt dùng `pnpm gen-game flappy-bird` + `pnpm install` (prompt `build` không biết generator); thay gameplay thẻ cào và test của nó, giữ test hợp đồng (SDK, tên, hygiene). Luật chơi viết thành câu kiểm được (3 trạng thái; một lần nhấn một flap; mỗi cặp ống cộng điểm một lần; độ khó có trần/sàn; game over → `submitResult(score)`; 3 sự kiện tracking). Số khởi đầu trong một object cấu hình, ghi rõ chỉnh sau bằng playtest. Behaviour phải giữ: bước thời gian cố định (60 Hz = 120 Hz), logic thuần + random có seed (tất định, test được), ẩn tab thì tạm dừng và không "nhảy" khi quay lại, giới hạn DPR của canvas ở 2. Out of scope: âm thanh/hình ảnh, leaderboard/chia sẻ, Storybook/e2e.
- Lần đầu có **số liệu token cho một game thật** (bảng usage trong PR body): dùng để quyết định có làm luồng nhẹ cho game không.

---

## Phần 4 — Giảm token của pipeline `issue-to-pr` (2026-11-10)

### Đã có sẵn trước khi tối ưu
- Model theo bước (Opus cho spec/plan/tasks, Sonnet cho implement/fix/review); build tách 2 phiên (`spec`, `implement`); 1 vòng fix; gate đỏ thì không gọi AI review; reviewer đọc `diff.patch` + `commits.txt` thay vì tự dò bằng git.

### Đã thêm
- **Đo usage:** mọi lệnh `claude` chạy qua `.github/scripts/run-claude.sh` với `--output-format json` → `usage.tsv` (turn, token input/cache/output, chi phí ước tính theo giá API, subtype) → bảng trong job summary và PR body (`.github/scripts/usage-table.sh`). Đã thử bằng `claude` giả: ghi đúng reply, giữ đúng exit code (cả khi lỗi), bảng tổng đúng.
- **Gate của vòng lặp khớp với `pr.yml`:** biến `GATES = lint check-types test buildSdk`. Trước đó vòng lặp không chạy `buildSdk`, nên một PR có thể qua vòng lặp mà vẫn đỏ CI.
- **Chặn đọc file lớn:** `.claude/settings.json` deny `Read` cho `pnpm-lock.yaml`, `node_modules/`, `dist/`, `.turbo/`.

### Số liệu đầu tiên (issue #28, `gen-game`)
- Tổng **khoảng 4,47 triệu token**, ước tính **3,05 USD** theo giá API; 145 turn. Dòng Total cũ chỉ cộng output (75.392), dễ đọc nhầm thành tổng token → sửa `usage-table.sh` thêm cột Tokens và tỷ lệ chi phí từng bước.
- **Cache read chiếm khoảng 93% lượng token** (4,17 triệu): mỗi turn đọc lại toàn bộ context. Nhưng cache read có giá rẻ, nên chi phí đi theo hình dạng khác.
- **Phiên `build-spec` (Opus) chiếm 64% chi phí** dù chỉ 40/145 turn: model đắt nhất, nhiều output nhất (42.857), context mỗi turn lớn nhất (~48k). `build-implement` (Sonnet) 63 turn chỉ 21%. Review + fix cộng lại ~15%.
- Kết luận: chỗ tiết kiệm lớn nhất là **phiên spec**: luồng nhẹ cho game (spec ngắn, không plan/research/analyze) hoặc chạy phiên spec bằng Sonnet cho game sinh từ template.

### Để sau, cần số liệu từ bảng usage trước
- Luồng nhẹ cho game hàng loạt (label riêng, spec ngắn chỉ có luật chơi, không plan/research/analyze).
- Giảm `--max-turns` theo số turn thực tế.

---

## Nợ

- **M0:** chưa tự liệt kê 5 rủi ro kỹ thuật và chưa tự lập luận cách tách brief thành feature (đã xem bản tham chiếu của mentor). Trả lại trước Module 14.
- **M1:** làm lại kiểm mutation trên **code được test** (đổi giới hạn trong `base.js` 60 → 61, 400 → 401, thấy test "rejects" đỏ rồi khôi phục). Lần trước mới đổi input của test.
- **M2:** kiểm push protection trong Settings → Code security; cân nhắc gitleaks pre-commit hook.
- **M3:** thêm `specs/` vào `.prettierignore` (PR hạ tầng riêng).
- **M3:** cân nhắc thêm vào `docs/sdd/spec-first-vs-code-first.md` tiêu chí "output có chương trình khác đọc → chỉ cần contract cho output trước".
