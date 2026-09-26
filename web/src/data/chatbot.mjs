// Chữ nghĩa của khung chat trợ lý AI — NGUỒN DUY NHẤT.
//
// Khung chat hiện ở góc phải dưới của mọi trang (ChatWidget.astro, gắn trong
// layouts/Trang.astro). Đổi lời chào, câu gợi ý hay dòng lưu ý thì sửa ở đây,
// không phải mở component.
//
// BẢN NHÁP: toàn bộ chữ dưới đây là đề xuất, chờ chủ site duyệt.

import { SO_ZALO, ZALO } from "./thong-tin.mjs";

export const CHATBOT = {
  /** Tên hiện trên đầu khung chat. */
  ten: "Trợ lý của bác sĩ Kiên",
  /** Dòng nhỏ dưới tên, đi cùng chấm xanh "đang online" ở ảnh đại diện. */
  trang_thai: "Online 24/7",
  /** Chữ trên nút tròn mở khung chat (đọc bởi trình đọc màn hình, và hiện
   *  cạnh nút trên máy tính). */
  chu_nut_mo: "Bạn có câu hỏi?",
  /** Tin nhắn đầu tiên trợ lý tự gửi khi người đọc mở khung chat. */
  loi_chao:
    "Chào bạn! Mình là Lâm, trợ lý của bác sĩ Lê Trung Kiên. " +
    "Bạn đang muốn tư vấn điều trị, hợp tác cùng bác sĩ Kiên, hay sản phẩm, dịch vụ nào ạ?",
  /** Câu hiện cạnh ba chấm nhấp nháy trong lúc chờ trợ lý trả lời. */
  cho_tra_loi: "Bạn chờ mình xíu nhé",
  /** Câu hỏi gợi ý bấm một chạm. Ẩn đi sau khi người đọc gửi câu đầu tiên.
   *  Nên giữ 3–4 câu, mỗi câu ngắn — trên điện thoại chúng xếp thành hàng. */
  goi_y: [
    "Bác sĩ Kiên là ai?",
    "Kinh nghiệm của bác sĩ Kiên?",
    "Phương pháp điều trị là gì?",
    "Đặt lịch khám thế nào?",
    "Mình muốn hợp tác với bác sĩ Kiên",
  ],
  /** Chữ mờ trong ô nhập. */
  o_nhap: "Nhập câu hỏi của bạn…",
  /** Dòng lưu ý dưới ô nhập. Trang của bác sĩ nên phải nói rõ AI không thay
   *  cho khám bệnh. */
  luu_y: "Trợ lý AI chỉ cung cấp thông tin tham khảo, không thay cho việc khám bệnh.",
  /** Trả lời khi gọi trợ lý bị lỗi (mất mạng, máy chủ trợ lý không phản hồi). */
  tra_loi_loi:
    "Xin lỗi, mình đang bận chưa thể hỗ trợ bạn lúc này. Bạn có thể thử lại sau 10 giây hoặc liên hệ trực tiếp bác sĩ Kiên qua Zalo " + SO_ZALO +
    " (" + ZALO + ") nhé ạ.",
  /** Trả lời tạm trong lúc chưa nối với trợ lý thật (dia_chi_agent để trống). */
  tra_loi_thu:
    "Xin lỗi, mình đang bận chưa thể hỗ trợ bạn lúc này. Bạn có thể thử lại sau 10 giây hoặc liên hệ trực tiếp bác sĩ Kiên qua Zalo " + SO_ZALO +
    " (" + ZALO + ") nhé ạ.",

  /**
   * Địa chỉ để khung chat gửi câu hỏi tới. Để trống thì khung chat
   * chạy chế độ thử, luôn đáp bằng tra_loi_thu.
   *
   * Đây là địa chỉ máy chủ trung gian (thư mục agent-proxy/ ở gốc kho) sau
   * khi đưa lên Cloud Run, dạng https://chatbot-proxy-….run.app — KHÔNG phải
   * địa chỉ agent. Cách đưa lên: agent-proxy/HUONG-DAN.md.
   *
   * Nếu lúc build có biến môi trường PUBLIC_CHATBOT_URL (đặt trên Cloudflare
   * Pages) thì biến đó được ưu tiên, ô này bị bỏ qua. Nên dùng biến môi
   * trường: web thật và bản xem trước trỏ được tới hai địa chỉ khác nhau.
   */
  dia_chi_agent: "https://chatbot-proxy-792364860221.us-west1.run.app",
};
