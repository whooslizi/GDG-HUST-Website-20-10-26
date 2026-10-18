-- 20/10 girls roster: token = login code. Fix TODO01 / TODO02 before running.
-- Safe to re-run: updates name/team/code/wish and keeps each girl's progress.
ALTER TABLE girls ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE girls ADD COLUMN IF NOT EXISTS welcome_wish TEXT;

INSERT INTO groups (id, group_name, secret_code, group_access_code, wish_message)
VALUES ('grp_hust', 'GDGoC HUST', '2010', 'GDGOC2010', 'Chúc toàn thể các bạn nữ GDGoC HUST ngày 20/10 luôn xinh đẹp, rạng rỡ và ngập tràn hạnh phúc!')
ON CONFLICT (id) DO NOTHING;

INSERT INTO girls (id, group_id, name, team, token, welcome_wish) VALUES
  ('girl_ktrmx', 'grp_hust', 'Phạm Hiền Minh', 'Innovation', 'KTRMX', 'GDG - HUST chúc Hiền Minh luôn tràn đầy ý tưởng đột phá và rạng rỡ mỗi ngày!'),
  ('girl_plqwz', 'grp_hust', 'Đinh Phương Mai', 'Innovation', 'PLQWZ', 'Chúc Phương Mai 20/10 thật nhiều niềm vui, luôn sáng tạo và tỏa sáng cùng Innovation!'),
  ('girl_hdfjk', 'grp_hust', 'Bùi Trần Phương Anh', 'Innovation', 'HDFJK', 'GDG - HUST chúc Phương Anh luôn xinh đẹp, tự tin và bứt phá mọi giới hạn!'),
  ('girl_zxcvb', 'grp_hust', 'Nguyễn Thị Quỳnh Anh', 'người có tuổi', 'ZXCVB', 'Chúc chị Quỳnh Anh 20/10 luôn tràn đầy sức sống, hạnh phúc và là điểm tựa ấm áp của GDG!'),
  ('girl_mnbvc', 'grp_hust', 'Phạm Lan Hương', 'Developer', 'MNBVC', 'GDG - HUST chúc Lan Hương code mượt không bug, luôn xinh đẹp và rạng rỡ!'),
  ('girl_qwert', 'grp_hust', 'Ninh Thị Thuỳ Dương', 'Innovation', 'QWERT', 'Chúc Thùy Dương 20/10 luôn vui vẻ, yêu đời và gặt hái thật nhiều thành công cùng team!'),
  ('girl_yuiop', 'grp_hust', 'Nguyễn Thị Tâm Thư', 'Innovation', 'YUIOP', 'GDG - HUST chúc Tâm Thư ngày 20/10 ngập tràn nụ cười, hạnh phúc và luôn giữ ngọn lửa sáng tạo!'),
  ('girl_asdfg', 'grp_hust', 'Nguyễn Thị Phương Thảo', 'Developer', 'ASDFG', 'Chúc Phương Thảo 20/10 luôn xinh tươi, học tập và làm việc cực mượt nha!'),
  ('girl_hjklz', 'grp_hust', 'Nguyễn Diệu Ánh', 'Operation', 'HJKLZ', 'GDG - HUST chúc Diệu Ánh luôn xinh đẹp, vận hành mượt mà và ngập tràn may mắn!'),
  ('girl_xcvbn', 'grp_hust', 'Lưu Bảo Ngọc', 'Operation', 'XCVBN', 'Chúc Bảo Ngọc 20/10 luôn tươi trẻ, rạng rỡ và thành công trên mọi hành trình!'),
  ('girl_rtyui', 'grp_hust', 'Trương Bảo Ngọc', 'Operation', 'RTYUI', 'GDG - HUST chúc Bảo Ngọc ngày phụ nữ Việt Nam ngập tràn quà, hoa và niềm vui!'),
  ('girl_fghjk', 'grp_hust', 'Trần Ánh Dương', 'Marcom', 'FGHJK', 'Chúc Ánh Dương luôn tỏa sáng đúng như tên gọi, thành công rực rỡ cùng Marcom!'),
  ('girl_cvbnm', 'grp_hust', 'Nguyễn Thủy Tiên', 'Marcom', 'CVBNM', 'GDG - HUST chúc Thủy Tiên 20/10 thật ấm áp, luôn giữ vẹn nguyên nhiệt huyết và nụ cười!'),
  ('girl_poiuy', 'grp_hust', 'Trịnh Kỳ Duyên', 'Content', 'POIUY', 'Chúc Kỳ Duyên ngày 20/10 ngọt ngào, câu từ luôn bay bổng và tràn đầy may mắn!'),
  ('girl_lkjhgf', 'grp_hust', 'Nguyễn Khánh Chi', 'Content', 'LKJHGF', 'GDG - HUST chúc Khánh Chi luôn xinh xắn, dồi dào cảm hứng sáng tạo Content!'),
  ('girl_trewq', 'grp_hust', 'Nguyễn Phương Linh', 'Content', 'TREWQ', 'Chúc Phương Linh 20/10 thật xinh đẹp, luôn vui tươi và có thật nhiều bài viết chất lượng!'),
  ('girl_todo01', 'grp_hust', 'Trần Lê Thùy Dương', 'Content', 'TODO01', 'GDG - HUST chúc Thùy Dương một ngày 20/10 trọn vẹn yêu thương và niềm vui!'),
  ('girl_lkjhg', 'grp_hust', 'Vũ Phương Linh', 'Design', 'LKJHG', 'Chúc Phương Linh 20/10 luôn sáng tạo không giới hạn, phối màu cuộc sống thật rực rỡ!'),
  ('girl_oiuyt', 'grp_hust', 'Nguyễn Phương Thảo', 'Design', 'OIUYT', 'GDG - HUST chúc Phương Thảo xinh đẹp, vẽ nên những thiết kế tuyệt vời và ấn tượng!'),
  ('girl_asdfh', 'grp_hust', 'Lê Thu Hà', 'Design', 'ASDFH', 'Chúc Thu Hà 20/10 ngập tràn niềm vui, luôn duyên dáng và tràn đầy năng lượng sáng tạo!'),
  ('girl_zxcvn', 'grp_hust', 'Nguyễn Minh Vy', 'Photo', 'ZXCVN', 'GDG - HUST chúc Minh Vy luôn bắt trọn mọi khoảnh khắc đẹp nhất của cuộc sống và GDG!'),
  ('girl_qazws', 'grp_hust', 'Trần Hà Đan', 'Data & AI', 'QAZWS', 'Chúc Hà Đan 20/10 luôn thông minh, rạng rỡ và chinh phục mọi mô hình AI!'),
  ('girl_edcrf', 'grp_hust', 'Đào My Lam', 'Data & AI', 'EDCRF', 'GDG - HUST chúc My Lam xinh đẹp, làm chủ dữ liệu và luôn gặt hái nhiều thành công!'),
  ('girl_tgbyh', 'grp_hust', 'Võ Thảo Nguyên', 'Data & AI', 'TGBYH', 'Chúc Thảo Nguyên 20/10 thật hạnh phúc, luôn vui vẻ và tỏa sáng cùng team Data!'),
  ('girl_ujmik', 'grp_hust', 'Đỗ Khánh Phương', 'Data & AI', 'UJMIK', 'GDG - HUST chúc Khánh Phương một ngày 20/10 ngọt ngào, rực rỡ và luôn yêu đời!'),
  ('girl_olpqa', 'grp_hust', 'Dương Ngọc Diệu', 'Web', 'OLPQA', 'Chúc Ngọc Diệu 20/10 luôn xinh tươi, code giao diện nào cũng mượt và đẹp mắt!'),
  ('girl_zsxdc', 'grp_hust', 'Hồ Thị Thảo Ngân', 'Web', 'ZSXDC', 'GDG - HUST chúc Thảo Ngân luôn rạng rỡ, hạnh phúc và gặt hái nhiều thành công mới!'),
  ('girl_fvgbh', 'grp_hust', 'Nguyễn Thảo Phương', 'Web', 'FVGBH', 'Chúc Thảo Phương 20/10 ngập tràn quà tặng, xinh đẹp và luôn nhiệt huyết với Web!'),
  ('girl_njmkh', 'grp_hust', 'Ngô Hoàng Gia Nhi', 'Event', 'NJMKH', 'GDG - HUST chúc Gia Nhi luôn năng động, xinh xắn và tổ chức sự kiện nào cũng bùng nổ!'),
  ('girl_plokm', 'grp_hust', 'Đỗ Minh Ánh', 'Event', 'PLOKM', 'Chúc Minh Ánh 20/10 thật niềm vui, luôn rạng rỡ và tràn đầy năng lượng tích cực!'),
  ('girl_qawsx', 'grp_hust', 'Phạm Khánh Ly', 'Event', 'QAWSX', 'GDG - HUST chúc Khánh Ly ngày càng xinh đẹp, tự tin và tỏa sáng rực rỡ!'),
  ('girl_edcvf', 'grp_hust', 'Hoàng Dạ Ngọc', 'HR', 'EDCVF', 'Chúc Dạ Ngọc 20/10 ngọt ngào, luôn xinh đẹp và là cầu nối gắn kết tuyệt vời của GDG!'),
  ('girl_todo02', 'grp_hust', 'Nguyễn Ngọc Hân', 'HR', 'TODO02', 'GDG - HUST chúc Ngọc Hân ngày 20/10 trọn vẹn niềm vui, xinh tươi và luôn yêu đời!'),
  ('girl_yhnmk', 'grp_hust', 'Nguyễn Tuệ Minh', 'PR', 'YHNMK', 'Chúc Tuệ Minh 20/10 luôn xinh đẹp, duyên dáng và đưa hình ảnh GDG lan tỏa khắp nơi!')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, team = EXCLUDED.team, token = EXCLUDED.token, welcome_wish = EXCLUDED.welcome_wish;
