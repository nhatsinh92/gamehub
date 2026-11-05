# Spec-first hay code-first

Tài liệu này giải thích cách áp dụng [Principle I. Spec-First](../../.specify/memory/constitution.md#i-spec-first) của constitution. Nó không thay luật: khi hai bên mâu thuẫn, constitution thắng.

## Tiêu chí

Chấm một việc theo các tiêu chí dưới đây. Chỉ cần **một** tiêu chí nghiêng về spec-first là việc đó cần spec.

| Tiêu chí | Nghiêng về spec-first khi… | Nghiêng về code-first khi… |
|---|---|---|
| Ai dùng? | Người ngoài team: integrator (app chủ), người chơi, marketing | Chỉ team dùng |
| Sai thì mất gì? | Quà thật, dữ liệu người dùng, hoặc lỗi nhân bản sang nơi khác | Chỉ team bị chậm; thấy lỗi ngay và sửa được ngay |
| Bao nhiêu thứ phụ thuộc vào nó? | Nhiều game, nhiều app, nhiều feature khác | Không có hoặc rất ít |
| Sửa lại có dễ không? | Khó: đổi là breaking change với bên đang dùng | Dễ: đổi xong không ảnh hưởng ai |
| Là sản phẩm hay thử nghiệm? | Sẽ được merge và dùng lâu dài | Thử để học, code sẽ bị bỏ |

**Ý tưởng còn mơ hồ không phải là lý do để code-first.** Nó có nghĩa là chưa sẵn sàng viết spec: cần `/speckit-clarify` hoặc một spike trước, rồi mới viết spec.

## Áp dụng cho GameHub

| Việc | Quyết định | Lý do |
|---|---|---|
| SDK nhúng vào app chủ | **Spec-first** | API công khai cho bên ngoài; đổi rồi khó sửa lại vì app chủ đã gọi. Chạy sai thì người dùng không chơi được game |
| Script generate game | **Spec-first** | Là công cụ nội bộ, nhưng mọi game mới đều sinh ra từ nó: lỗi của script nhân bản sang tất cả game |
| Workflow CI | **Code-first** | Không có hành vi người dùng, chỉ team dùng; pipeline tự kiểm chính nó (chạy xanh hay đỏ là thấy). Thuộc ngoại lệ "tooling/infra" của Principle I. Điều kiện: PR mô tả thay đổi, lý do và cách kiểm; mỗi gate được giải thích trong `docs/sdd/ci.md` |
| Prototype vật lý để playtest | **Code-first** | Là spike để học, không phải sản phẩm. Điều kiện: code bị bỏ trước khi merge (Principle I); kết quả playtest được ghi vào `research.md` của feature |

## Chuyển từ code-first sang spec-first

- **Spike / prototype:** code bị bỏ. Thứ được giữ lại là kết quả học được (thông số, phương án đã chọn), ghi vào `research.md`, rồi viết thành FR/SC trong spec mới.
- **Code đã có và muốn giữ** (chưa có spec): dùng AI để draft spec từ code hiện có. Bản draft được người sở hữu duyệt như mọi spec khác (Principle II); sau đó code phải có test gắn tag theo FR (Principle III).
