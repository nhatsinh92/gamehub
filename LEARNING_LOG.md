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
  | A: thêm `picocolors` | `guard-deps` | Đỏ, `APPROVED: false`, merge `BLOCKED`. Có label → <kết quả bước 7> |
  | B: token giả `ghp_…`, rồi xoá ở commit sau | `secrets` | Đỏ, `github-pat` ở commit thêm token, dù diff cuối không còn token |
  | C: hàm 61 dòng | `verify` → lint | Đỏ, đúng 1 lỗi `max-lines-per-function`, merge `BLOCKED` |
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

## Nợ

- **M0:** chưa tự liệt kê 5 rủi ro kỹ thuật và chưa tự lập luận cách tách brief thành feature (đã xem bản tham chiếu của mentor). Trả lại trước Module 14.
- **M1:** ghi lý do bỏ `no-explicit-any` (mục *Quyết định* ở trên).
- **M1:** làm lại kiểm mutation trên **code được test** (đổi giới hạn trong `base.js` 60 → 61, 400 → 401, thấy test "rejects" đỏ rồi khôi phục). Lần trước mới đổi input của test.
- **M2:** điền số PR A/B/C và kết quả bước 7 (PR A có label) vào `docs/sdd/ci.md` và entry Module 2.
- **M2:** kiểm push protection trong Settings → Code security; cân nhắc gitleaks pre-commit hook.
