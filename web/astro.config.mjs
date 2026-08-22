// @ts-check
import { defineConfig } from "astro/config";
import nhatKyDev from "./dev-nhat-ky.mjs";

// https://astro.build/config
export default defineConfig({
  // Ghi lỗi ở trình duyệt xuống web/nhat-ky-dev.log. Chỉ hoạt động khi
  // "astro dev"; lúc build thì integration này tự tắt.
  integrations: [nhatKyDev()],

  // Địa chỉ thật của site. Astro dùng nó để sinh sitemap và các URL tuyệt
  // đối — sai chỗ này là canonical sai trên toàn bộ trang.
  site: "https://bacsikien.com",

  // Build ra HTML tĩnh. Đây là điều kiện để giữ nguyên SEO: mỗi bài viết là
  // một file .html có sẵn đủ tiêu đề, mô tả, thẻ chia sẻ — Google và
  // Facebook đọc được ngay, không phải chạy JS.
  output: "static",

  // Sinh "blog/bai-viet.html" thay vì "blog/bai-viet/index.html", để đường
  // dẫn khớp y hệt site cũ và mọi link đã chia sẻ ra ngoài vẫn sống.
  build: { format: "file" },

  // Không thêm dấu "/" vào cuối URL — site cũ không có, thêm vào là Google
  // coi như hai trang khác nhau và chia đôi thứ hạng.
  trailingSlash: "never",
});
