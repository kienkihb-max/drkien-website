-- Cập nhật tiêu đề và mô tả gửi Google theo luật mới:
--   tiêu đề = "Bác sĩ Kiên | " + tiêu đề bài
--   mô tả   = "Bác sĩ Lê Trung Kiên: " + mô tả cắt từ đoạn mở đầu
--
-- Sinh bằng web/../scratchpad/sinh-sql-seo.mjs, dùng đúng hàm cắt chữ
-- của trang soạn bài nên khớp với cái CMS sẽ sinh ra ở lần lưu sau.

update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Hơn Cả Chạy Bộ: Giải Mã Sức Mạnh Well-being…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Mình rất vui khi có cơ hội đồng hành cùng chương trình WeTAS | Hơn Cả Chạy Bộ: Giải Mã Sức Mạnh Well-being Của Marathon, trong khuôn khổ…'
  where slug = 'hon-ca-chay-bo-giai-ma-suc-manh-well-being-cua-marathon';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Đan sâm – Tam thất: Càng tìm hiểu càng thú vị', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Ở khoa Ngoại Y học cổ truyền, mình thường dùng cặp thuốc này khi gặp những trường hợp chấn thương phần mềm có bầm tím, sưng nề, với mục…'
  where slug = 'dan-sam-tam-that-cang-tim-hieu-cang-thu-vi';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Tam thất dưới góc nhìn của một bác sĩ Y học…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Nếu hỏi mình về một vị thuốc vừa quen thuộc, vừa dễ bị sử dụng sai, có lẽ mình sẽ nghĩ ngay đến Tam thất.'
  where slug = 'tam-that-duoi-goc-nhin-cua-mot-bac-si-y-hoc-co-truyen';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Thoái hóa khớp gối: Những điều người bệnh nên…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Chia sẻ từ thực tế khám và điều trị về thoái hóa khớp gối: vì sao người bệnh không nên quá sợ vận động, tại sao mức độ đau không phải lúc…'
  where slug = 'thoai-hoa-khop-goi-nhung-dieu-nguoi-benh-nen-biet';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Công nghệ AI phân tích dáng chạy', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Nếu bạn từng đau đầu gối, đau gân gót hay đau cẳng chân mỗi khi chạy bộ mà không rõ nguyên nhân, có lẽ bạn đã nghe ai đó khuyên "nên đi…'
  where slug = 'cong-nghe-ai-phan-tich-dang-chay-khi-khoa-hoc-phong-lab-buoc';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Câu chuyện về cứu ngải', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Con mình được 7 tháng, ngày càng lớn, ông bà nội phải xuống ở cùng để phụ trông cháu. Xuống được vài hôm thì bà bắt đầu kêu đau lưng.'
  where slug = 'cau-chuyen-ve-cuu-ngai';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Đau thần kinh tọa: khi nào cần lo', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Đau lưng kèm đau lan xuống chân — nhiều người quen gọi là "đau thần kinh tọa" — là một trong những lý do phổ biến nhất khiến người bệnh…'
  where slug = 'dau-lan-xuong-chan-do-re-than-kinh-that-lung';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - SEA Games 31 và một nhiệm vụ đặc biệt', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Kỷ niệm làm công tác y tế tại SEA Games 31: từ áp lực phòng chống COVID-19, theo dõi đoàn Singapore tại Landmark72 đến những cuộc gặp với…'
  where slug = 'sea-games-31-va-mot-nhiem-vu-dac-biet';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Chuyện lạ trong phòng y tế sự kiện', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Những năm gần đây, mình có cơ hội tham gia công tác y tế tại khá nhiều concert, lễ hội âm nhạc và sự kiện ngoài trời đông người.'
  where slug = 'cau-chuyen-hi-huu-y-te-su-kien';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Vì sao tổn thương stress xương ghe đáng lo ngại?', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Trong số các chấn thương do quá tải ở bàn chân, tổn thương stress xương ghe (navicular bone stress injury – BSI) là một trong những tình…'
  where slug = 'vi-sao-ton-thuong-stress-xuong-ghe-dang-lo-ngai';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Chuột rút khi chạy bộ: Chuối hay tập tạ mới…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Chuột rút liên quan đến vận động (Exercise-Associated Muscle Cramps – EAMC) là một trong những vấn đề thường gặp nhất ở các môn thể thao…'
  where slug = 'chuot-rut-khi-chay-bo';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Đau dọc mặt trong xương chày (Shin Splints)', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Đau dọc mặt trong cẳng chân là một trong những nguyên nhân phổ biến khiến người chạy bộ phải giảm khối lượng tập luyện hoặc tạm ngừng vận…'
  where slug = 'shin-splints-dau-xuong-chay';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Khi nào người bệnh có thể chạy trở lại sau…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: “Bác sĩ ơi, bao giờ tôi có thể chạy lại được?” Đây có lẽ là một trong những câu hỏi phổ biến nhất của người bệnh sau phẫu thuật tái tạo…'
  where slug = 'chuot-rut-khi-van-dong';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Tôi đi làm cả ngày, như vậy đã đủ vận động chưa?', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Đây là một câu hỏi mình thường gặp khi trao đổi với bệnh nhân, đồng nghiệp hoặc những người làm các công việc phải di chuyển liên tục như…'
  where slug = 'xu-huong-phat-trien-yhct';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Thoát vị đĩa đệm: 6 sự thật có thể khác với…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Thoát vị đĩa đệm có lẽ là một trong những chẩn đoán khiến bệnh nhân lo lắng nhất khi đi khám đau lưng.'
  where slug = 'van-dong-phuc-hoi-cot-song';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Đau lưng dân văn phòng: đừng chờ đau mới đi khám', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Nhân dịp Ngày Gia đình Việt Nam 28/6, mình có cơ hội tham gia một buổi seminar/talkshow về sức khỏe cột sống dành cho anh em văn phòng…'
  where slug = 'dau-cot-song-dan-van-phong-talkshow-tigren';
update bai_viet set seo_tieu_de = 'Bác sĩ Kiên - Những bài học mùa hè có thể theo các em suốt…', seo_mo_ta = 'Bác sĩ Lê Trung Kiên: Mỗi mùa hè, trẻ em đều có thêm thời gian để vui chơi, khám phá và trải nghiệm những điều mới mẻ.'
  where slug = 'so-cuu-tre-em-tap-huan-mai-dich';
