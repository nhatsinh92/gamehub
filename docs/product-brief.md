# GameHub — Product Brief

**Version**: 1.0.0
**Owner**: PO
**Last Updated**: 2026-11-03

## B1. Tầm nhìn

GameHub là **nền tảng làm và phát hành mini-game HTML5** cho các chiến dịch marketing của một sàn thương mại điện tử. Game được **nhúng vào app hoặc website của sàn** (thường chạy trong WebView trên mobile). Mục đích là tăng tương tác, giữ chân người dùng và dẫn họ tới mua hàng (nhận voucher, gợi ý sản phẩm).

Nền tảng phải giúp team **ra game mới nhanh** mà mỗi game vẫn **an toàn, nhẹ và nhất quán**.

## B2. Các bên liên quan

| Vai trò | Họ cần gì |
|---|---|
| **Người chơi** | Vào chơi ngay, mượt trên điện thoại tầm trung. Biết mình còn bao nhiêu lượt, điểm cao nhất, hạng. Nhận quà công bằng. |
| **App chủ (integrator)** | Nhúng game bằng vài dòng code. Game không phá CSS/JS của trang. Truyền vào token đăng nhập, hàm làm mới token, hàm tracking. Tháo game ra sạch sẽ. |
| **Dev game** | Tạo game mới từ template trong vài phút. Phần dùng chung (đăng nhập, lượt chơi, nhận thưởng, tracking) có sẵn. Chỉ tập trung viết gameplay. |
| **PO / Marketing** | Bật/tắt game không cần deploy lại. Có số liệu tracking để đo hiệu quả. Có trang catalog để xem và thử từng game, từng phiên bản. |

## B3. Hành trình chính

1. App chủ tải bundle SDK của game, gọi khởi tạo vào một vùng trên trang và truyền cấu hình.
2. Game lấy cấu hình và trạng thái người chơi: lượt còn lại, best score, hạng.
3. Người chơi chơi một ván. Hết ván, game gửi kết quả lên server. Server trả về: thắng/thua, quà (nếu có), lượt còn lại. Các trạng thái đặc biệt: hết lượt, đang bảo trì, lỗi.
4. Trong suốt quá trình, game phát các sự kiện tracking qua hàm do app chủ cung cấp.
5. Khi app chủ rời trang, game được tháo ra.

## B4. Năng lực nền tảng (phạm vi MVP để học)

- **SDK nhúng:** mỗi game build thành một bundle nhúng được. Có chế độ chạy độc lập (để dev và demo) và chế độ nhúng (cô lập style khỏi trang chủ).
- **Phiên chơi:** lấy cấu hình game và trạng thái người chơi, gửi kết quả nhận thưởng, xử lý các trạng thái hết lượt / bảo trì / lỗi.
- **Chống gian lận cơ bản:** request gửi kết quả phải được ký, server kiểm được. Game không tin dữ liệu điểm do client tự báo mà không có ràng buộc.
- **Tracking:** có danh sách sự kiện chuẩn dùng chung cho mọi game.
- **Template + generator:** sinh game mới từ một template chuẩn.
- **Game đầu tiên:** một game kiểu "bay qua chướng ngại vật": chạm để bay lên, tránh vật cản, độ khó tăng dần. PO chỉ có ý tưởng; luật chơi chi tiết do team đề xuất.
- **Catalog:** một trang tĩnh liệt kê các game và phiên bản SDK, có chỗ chơi thử.

## B5. Ràng buộc và ngoài phạm vi

- Chạy tốt trên mobile WebView (iOS và Android), điện thoại tầm trung. Bundle nhỏ.
- Không có backend thật. Server được mô phỏng bằng mock. Contract API do team tự thiết kế.
- Môi trường: **local** (dev server) và **production** (bản build do CI deploy). Không cần môi trường trung gian.
- Không lưu và không log token hay thông tin cá nhân của người chơi.
- Ngoài phạm vi: captcha thật, đa ngôn ngữ, leaderboard toàn server, thanh toán.

## PO Q&A (2026-11-03)

Câu trả lời của PO cho các câu hỏi ở Module 0. Là đầu vào cho `/speckit-constitution` và các spec 002/003.

| # | Câu hỏi | Trả lời của PO |
|---|---|---|
| 1 | Mỗi người có bao nhiêu lượt chơi? | Số lượt do từng campaign cấu hình. Campaign đầu: 3 lượt/ngày, reset 0h giờ Việt Nam. Server quyết định và đếm lượt; game chỉ hiển thị số server trả về. MVP không có cơ chế kiếm thêm lượt. |
| 2 | Danh sách tracking gồm những gì? | Đo được cả phễu: game tải xong (kèm thời gian tải), bắt đầu ván, kết thúc ván (điểm, thắng/thua), nhận quà thành công, bấm voucher/sản phẩm gợi ý, gặp trạng thái hết lượt/bảo trì/lỗi. Mọi game dùng chung một bộ sự kiện. Không có token hay thông tin cá nhân trong payload. Field và schema do team thiết kế. |
| 3 | "Bundle nhỏ", "điện thoại tầm trung" là bao nhiêu? | Yêu cầu tính bằng trải nghiệm: mở game trên 4G khoảng 3 giây là chơi được, chơi không giật. Máy tham chiếu: Android tầm trung khoảng 2–3 năm tuổi (ví dụ dòng Samsung Galaxy A) và iPhone đời cũ còn được hỗ trợ (ví dụ iPhone 11), chạy trong WebView. Team quy đổi ra ngân sách KB/FPS trong constitution và báo PO duyệt. |
| 4 | Tắt game khi người chơi đang giữa ván? | Ván đang dở được chơi hết. Khi gửi kết quả, nếu game đã tắt: server trả trạng thái bảo trì, không trừ lượt, không trao quà; người chơi thấy "đang bảo trì, lượt của bạn được giữ nguyên". Không bắt đầu được ván mới. |
| 5 | "Nhận quà công bằng" nghĩa là gì, ai quyết quà theo điểm? | (a) Cùng kết quả thì cùng quà: marketing cấu hình bảng quà theo mốc điểm cho từng campaign; server quyết quà, game không bao giờ tự quyết. (b) Người gian lận không lấy được quà: kết quả gửi lên phải chứng minh được là thật, điểm vô lý bị từ chối. (c) Hết quà thì server báo rõ, game hiển thị đúng như vậy. |

## Changelog

- 1.0.0 (2026-11-03): Bản đầu tiên, kèm PO Q&A từ Module 0.
