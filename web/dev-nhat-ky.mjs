// Đường ghi nhật ký từ trình duyệt xuống file — CHỈ chạy lúc dev.
//
// Vì sao cần: lỗi xảy ra trong phiên đăng nhập của chủ site, trên máy chủ
// site. Người sửa lỗi không mở được phiên đó, nên không thấy Console. Trước
// đây phải nhờ chụp màn hình từng lần, vừa chậm vừa sót.
//
// Nay trang admin gửi mọi lỗi về đây, và file nhat-ky-dev.log nằm ngay
// trong repo để đọc trực tiếp.
//
// Đây là một Astro integration cài thêm middleware vào máy chủ dev của
// Vite. configureServer CHỈ chạy khi "astro dev", nên "astro build" hoàn
// toàn không biết đến nó — bản thật không có đường này.

import { appendFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const FILE_LOG = join(THU_MUC, "nhat-ky-dev.log");
const DUONG_DAN = "/__nhat-ky";

export default function nhatKyDev() {
  return {
    name: "nhat-ky-dev",
    hooks: {
      "astro:config:setup": ({ updateConfig, command }) => {
        if (command !== "dev") return;
        updateConfig({
          vite: {
            plugins: [
              {
                name: "nhat-ky-dev",
                apply: "serve",
                async configureServer(server) {
                  // Mỗi lần khởi động dev là một file mới, khỏi lẫn với
                  // lần chạy trước.
                  await writeFile(
                    FILE_LOG,
                    `# Nhật ký dev — mở lúc ${new Date().toISOString()}\n`,
                    "utf8"
                  );

                  server.middlewares.use(DUONG_DAN, (req, res) => {
                    if (req.method !== "POST") {
                      res.statusCode = 405;
                      res.end();
                      return;
                    }
                    let than = "";
                    req.on("data", (c) => {
                      than += c;
                      // Chặn gói quá to: một vòng lặp lỗi có thể bắn hàng
                      // megabyte và làm nghẽn máy chủ dev.
                      if (than.length > 64_000) req.destroy();
                    });
                    req.on("end", async () => {
                      try {
                        const d = JSON.parse(than);
                        const dong =
                          `[${new Date().toISOString()}] ${d.muc ?? "log"} ` +
                          `${d.trang ?? "?"} — ${d.chu ?? ""}` +
                          (d.chi_tiet ? `\n    ${d.chi_tiet}` : "");
                        await appendFile(FILE_LOG, dong + "\n", "utf8");
                        // In luôn ra cửa sổ chạy dev, để chủ site cũng thấy.
                        console.log("[nhật ký] " + dong);
                      } catch {
                        await appendFile(
                          FILE_LOG,
                          `[${new Date().toISOString()}] KHONG_DOC_DUOC ${than.slice(0, 500)}\n`,
                          "utf8"
                        );
                      }
                      res.statusCode = 204;
                      res.end();
                    });
                  });
                },
              },
            ],
          },
        });
      },
    },
  };
}
