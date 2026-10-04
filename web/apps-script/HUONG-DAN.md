# Nối Phiếu Thập Vấn với Google Sheet và Google Drive

Làm **một lần**, khoảng 10 phút. Bệnh nhân không phải đăng nhập gì cả.
Hết bước này, mỗi phiếu gửi về là một dòng trong Google Sheet của bác sĩ,
ảnh lưỡi nằm trong một thư mục Google Drive của bác sĩ.

## Cách hoạt động

```
Bệnh nhân điền phiếu ──► trang /sang-loc-benh ──► Apps Script (của bác sĩ)
                                                      │
                                       ┌──────────────┴──────────────┐
                                       ▼                             ▼
                              Google Sheet "Phiếu"          Google Drive
                           (mỗi câu hỏi một cột,        (thư mục "Phiếu thập vấn
                            mỗi phiếu một dòng)           - ảnh lưỡi", ảnh riêng tư)
```

## Bước 1. Tạo Google Sheet

1. Vào <https://sheets.google.com>, đăng nhập đúng tài khoản Google của bác sĩ.
2. Bấm **Trống** để tạo bảng tính mới, đặt tên: `Phiếu thập vấn`.

Không cần tạo cột nào — script tự lập tiêu đề cột ở lần gửi đầu tiên.

## Bước 2. Dán script

1. Trong Sheet: menu **Tiện ích mở rộng → Apps Script**.
2. Xóa hết code mẫu có sẵn.
3. Mở file `web/apps-script/phieu-thap-van.gs` trong kho code, chép **toàn bộ**
   rồi dán vào.
4. Bấm biểu tượng đĩa mềm (**Lưu dự án**).

## Bước 3. Triển khai thành địa chỉ nhận phiếu

1. Góc trên phải bấm **Triển khai → Tùy chọn triển khai mới**.
2. Bấm bánh răng cạnh "Chọn loại" → chọn **Ứng dụng web**.
3. Điền:
   - **Thực thi dưới tư cách**: `Tôi` (tài khoản của bác sĩ)
   - **Người có quyền truy cập**: `Bất kỳ ai`
4. Bấm **Triển khai**. Google hỏi cấp quyền: chọn tài khoản → **Nâng cao** →
   **Đi tới … (không an toàn)** → **Cho phép**. (Cảnh báo này xuất hiện vì
   script do chính bác sĩ viết, chưa qua Google duyệt. Script cần quyền ghi
   vào Sheet và tạo thư mục trong Drive.)
5. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).

> "Bất kỳ ai" nghĩa là ai cũng *gửi* được vào địa chỉ này — điều cần thiết
> để bệnh nhân không phải đăng nhập. Không ai *đọc* được dữ liệu qua địa chỉ
> này: script chỉ có phần nhận vào.

## Bước 4. Gắn địa chỉ vào trang web

Trên Cloudflare Pages, mục **Environment variables**, thêm cho **cả Production
và Preview**:

```
PUBLIC_PHIEU_URL = <URL vừa chép ở bước 3>
```

Rồi **Deployments → Retry deployment** để trang dựng lại với biến mới (biến
chỉ có hiệu lực ở lần build sau khi thêm).

Chạy thử trên máy: chép `web/.env.example` thành `web/.env` (nếu chưa có),
điền dòng `PUBLIC_PHIEU_URL=` rồi chạy `npm --prefix web run dev`.

## Bước 5. Thử

1. Mở `https://bacsikien.com/sang-loc-benh`, điền một phiếu thử (nhớ tải ảnh).
2. Mở Google Sheet: phải có sheet **Phiếu**, một dòng mới, ảnh là link.
3. Mở Google Drive: có thư mục **Phiếu thập vấn - ảnh lưỡi** chứa ảnh.
4. Xóa dòng phiếu thử và ảnh thử đi.

## Khi sửa script về sau

Sửa code trong Apps Script xong phải **Triển khai → Quản lý các lần triển khai
→ bút chì → Phiên bản: Phiên bản mới → Triển khai**. Cách này giữ nguyên URL.
Nếu chọn "Tùy chọn triển khai mới" thì URL đổi, phải cập nhật lại bước 4.

## Điều cần biết về dữ liệu

- **Thứ tự cột**: cột xuất hiện theo lần đầu gặp câu hỏi. Chuyên khoa nào chưa
  có ai chọn thì chưa có cột của bộ câu hỏi đó. Muốn cố định thứ tự, gửi thử
  mỗi chuyên khoa một phiếu.
- **Tên cột** là `Tên phần | Câu hỏi`. Sửa chữ câu hỏi trong
  `data/phieu-thap-van.mjs` sẽ sinh **cột mới** (cột cũ giữ nguyên dữ liệu cũ).
- Câu chọn nhiều đáp án: các đáp án ngăn bằng ` | ` trong cùng một ô.
- Ảnh trong Drive để **riêng tư**. Đừng bật "ai có link cũng xem được".
- Phiếu trống một số câu không bắt buộc thì ô để trống.
- Trang không gửi kèm bất kỳ điểm số hay tên thể bệnh nào. Việc tính điểm làm
  riêng trong Sheet.
