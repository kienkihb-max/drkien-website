# Máy chủ trung gian cho chatbot

Khung chat trên web không gọi thẳng agent được: gọi agent cần quyền tài
khoản Google Cloud, mà để quyền đó trên trang web thì ai cũng lấy được.
Thư mục này là một máy chủ nhỏ chạy trên **Cloud Run**, đứng giữa:

```
khung chat trên web  →  máy chủ trung gian (Cloud Run)  →  agent (Agent Engine)
```

Agent đang nối: dự án `warm-gantry-z0w9t`, vùng `us-west1`, mã agent
`7012601599071617024` (agent MVP1, ghi sẵn trong `index.js`, đổi được bằng
biến môi trường `AGENT_PROJECT`, `AGENT_LOCATION`, `AGENT_ENGINE_ID`).

Máy chủ tự bảo vệ bằng ba lớp:

- Chỉ nhận yêu cầu từ trang có trong `ALLOWED_ORIGINS` (mặc định:
  bacsikien.com và localhost).
- Mỗi địa chỉ IP hỏi tối đa 20 câu mỗi 10 phút (`RATE_LIMIT_PER_IP`,
  `RATE_WINDOW_MINUTES`).
- Mỗi cuộc trò chuyện tối đa 30 câu (`MAX_TURNS_PER_SESSION`); hỏi tiếp thì
  bấm nút "Đoạn chat mới".

Quá giới hạn thì khung chat hiện câu báo lỗi kèm số Zalo.

---

## Chạy thử trên máy (chưa cần Cloud Run)

Đã `gcloud auth login` một lần là đủ. Mở hai cửa sổ terminal ở gốc kho:

```bash
npm --prefix agent-proxy run dev
```

```bash
npm --prefix web run dev
```

Mở trang web ở localhost, bấm nút chat. Lúc chạy thử, khung chat tự gọi
máy chủ trung gian ở `localhost:8099` — không cần đặt gì thêm.

---

## Đưa lên Cloud Run — làm một lần

Cần cài Google Cloud CLI: https://cloud.google.com/sdk/docs/install

Mọi lệnh chạy ở **gốc kho** (thư mục có `agent-proxy/` và `web/`). Chạy
lần lượt, chờ lệnh trước xong mới chạy lệnh sau.

### Bước 1. Đăng nhập

Mở trình duyệt để chọn tài khoản Google chủ dự án:

```bash
gcloud auth login
```

### Bước 2. Tạo tài khoản dịch vụ riêng cho chatbot

Máy chủ trung gian chạy bằng một "tài khoản dịch vụ" riêng tên
`chatbot-proxy`, chỉ có đúng quyền gọi agent. Không dùng tài khoản mặc định
của dự án, vì tài khoản đó có quyền sửa gần như mọi thứ — lỡ máy chủ bị lợi
dụng thì thiệt hại lớn.

```bash
gcloud iam service-accounts create chatbot-proxy --project warm-gantry-z0w9t --display-name "Chatbot web bacsikien.com"
```

### Bước 3. Cho tài khoản đó quyền gọi agent (và chỉ quyền đó)

```bash
gcloud projects add-iam-policy-binding warm-gantry-z0w9t --member "serviceAccount:chatbot-proxy@warm-gantry-z0w9t.iam.gserviceaccount.com" --role "roles/aiplatform.user"
```

Nếu gcloud hỏi về "condition", chọn **None**.

### Bước 4. Đưa máy chủ cho web thật lên

```bash
gcloud run deploy chatbot-proxy --source agent-proxy --region us-west1 --project warm-gantry-z0w9t --service-account chatbot-proxy@warm-gantry-z0w9t.iam.gserviceaccount.com --allow-unauthenticated --max-instances 2 --set-env-vars "ALLOWED_ORIGINS=https://bacsikien.com https://www.bacsikien.com"
```

Lần đầu gcloud có thể hỏi bật vài dịch vụ (Cloud Run, Cloud Build,
Artifact Registry) hoặc tạo kho chứa — cứ gõ `Y`. Mất khoảng 2–4 phút.

Giải thích mấy chỗ trong lệnh:

- `--allow-unauthenticated`: trang web gọi được mà người đọc không phải
  đăng nhập. Máy chủ tự chặn trang lạ bằng `ALLOWED_ORIGINS`.
- `--max-instances 2`: tối đa hai máy chạy cùng lúc — hàng rào về tiền
  nếu có ai gửi dồn dập.
- `ALLOWED_ORIGINS`: các địa chỉ được gọi, **ngăn bằng dấu cách** (không
  dùng dấu phẩy — gcloud hiểu dấu phẩy là sang biến khác).

Xong, lệnh in ra một địa chỉ dạng
`https://chatbot-proxy-xxxxxxxxxx.us-west1.run.app`. **Chép lại** — dùng ở
bước 6.

### Bước 5 (tuỳ chọn). Máy chủ riêng cho bản xem trước

Bản xem trước của Cloudflare Pages dùng để thử agent mới mà web thật không
bị ảnh hưởng. Cách gọn nhất là một máy chủ thứ hai, tên `chatbot-proxy-thu`,
chỉ nhận yêu cầu từ bản xem trước và từ máy mình.

Thay `TEN-PROJECT` bằng tên project Pages (phần trước `.pages.dev` trong
địa chỉ Cloudflare cho, xem `web/TRIEN-KHAI.md` bước 3). Muốn nối agent
khác thì thay luôn `MA-AGENT-THU`; muốn dùng chung agent MVP1 thì bỏ hẳn
đoạn `AGENT_ENGINE_ID=…` cùng dấu phẩy trước nó.

```bash
gcloud run deploy chatbot-proxy-thu --source agent-proxy --region us-west1 --project warm-gantry-z0w9t --service-account chatbot-proxy@warm-gantry-z0w9t.iam.gserviceaccount.com --allow-unauthenticated --max-instances 1 --set-env-vars "ALLOWED_ORIGINS=https://*.TEN-PROJECT.pages.dev http://localhost:4321 http://localhost:4322,AGENT_ENGINE_ID=MA-AGENT-THU"
```

`https://*.TEN-PROJECT.pages.dev` nghĩa là mọi bản xem trước của đúng
project này (ví dụ `https://ai-chatbot.TEN-PROJECT.pages.dev`). Máy chủ
không chấp nhận `https://*.pages.dev` trơn — như thế là mở cho trang của
bất kỳ ai trên Cloudflare.

Chép lại địa chỉ `https://chatbot-proxy-thu-….run.app` lệnh in ra.

### Bước 6. Thử máy chủ vừa lên

Thay địa chỉ ở cuối bằng địa chỉ bước 4:

```bash
curl -X POST -H "Origin: https://bacsikien.com" -H "Content-Type: application/json" -d "{\"message\":\"Bác sĩ Kiên là ai?\"}" https://chatbot-proxy-xxxxxxxxxx.us-west1.run.app
```

Đợi 10–20 giây, thấy `{"reply":"…","session_id":"…"}` là chạy. Thấy
`Agent error` thì xem mục **Xem lỗi** bên dưới — thường là bước 3 chưa làm.

### Bước 7. Báo cho web biết địa chỉ máy chủ

Làm trên Cloudflare, không sửa code:

1. <https://dash.cloudflare.com> → **Workers & Pages** → chọn project web.
2. **Settings → Variables and Secrets** (có nơi ghi "Environment
   variables") → **Add**.
3. Thêm biến `PUBLIC_CHATBOT_URL`:
   - **Production**: địa chỉ bước 4 (`https://chatbot-proxy-….run.app`).
   - **Preview**: địa chỉ bước 5 nếu có làm; không làm bước 5 thì để
     trống — bản xem trước sẽ chạy chế độ thử (luôn đáp câu "đang thử
     nghiệm").
   Loại biến chọn **Text** (không cần Secret: địa chỉ này ai mở trang cũng
   thấy).
4. Biến chỉ có tác dụng từ lần dựng sau: vào **Deployments**, bản mới nhất
   → **Retry deployment** (hoặc đẩy commit mới).

Khi nào biến trên Cloudflare còn trống, web dùng ô `dia_chi_agent` trong
`web/src/data/chatbot.mjs`; ô đó cũng trống thì chạy chế độ thử.

### Bước 8. Khoá bản xem trước bằng Cloudflare Access

Để người ngoài không mở được bản xem trước (nơi thử agent mới):

1. Cloudflare → project web → **Settings → General**.
2. Mục **Access policy** → bật **Enable access policy** cho Preview
   deployments.
3. Cloudflare tạo sẵn một ứng dụng trong **Zero Trust → Access →
   Applications**. Mở nó → **Policies** → sửa để chỉ cho phép email của
   mình (và ai được mời thử), kiểu **Include → Emails**.
   Lần đầu dùng Zero Trust, Cloudflare bắt chọn tên nhóm và gói — chọn gói
   **Free** (tối đa 50 người).
4. Mở thử một địa chỉ xem trước trong cửa sổ ẩn danh: phải hiện trang
   Cloudflare hỏi email, nhập email được phép thì nhận mã qua thư.

Web thật (bacsikien.com) không bị ảnh hưởng.

---

## Sửa code rồi đưa lên lại

Chạy lại đúng lệnh ở bước 4 (và bước 5 nếu có máy chủ xem trước).

## Chỉnh giới hạn chống lạm dụng

Không cần đưa code lên lại, chỉ đổi biến môi trường. Ví dụ cho mỗi IP hỏi
40 câu mỗi 10 phút:

```bash
gcloud run services update chatbot-proxy --region us-west1 --project warm-gantry-z0w9t --update-env-vars RATE_LIMIT_PER_IP=40
```

## Xem lỗi

Google Cloud Console → Cloud Run → `chatbot-proxy` → tab **Logs**.
