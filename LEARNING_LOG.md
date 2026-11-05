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

## Nợ

- **M0:** chưa tự liệt kê 5 rủi ro kỹ thuật và chưa tự lập luận cách tách brief thành feature (đã xem bản tham chiếu của mentor). Trả lại trước Module 14.
- **M1:** ghi lý do bỏ `no-explicit-any` (mục *Quyết định* ở trên).
- **M1:** làm lại kiểm mutation trên **code được test** (đổi giới hạn trong `base.js` 60 → 61, 400 → 401, thấy test "rejects" đỏ rồi khôi phục). Lần trước mới đổi input của test.
