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

## Nợ

- **M0:** chưa tự liệt kê 5 rủi ro kỹ thuật và chưa tự lập luận cách tách brief thành feature (đã xem bản tham chiếu của mentor). Trả lại trước Module 14.
