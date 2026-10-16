import type { Boy, Girl, Group, EmailPreviewData, EmailExportItem } from "../types/database.ts";

export function generateGirlInvitationEmail(
  girl: Girl,
  group?: Group,
  baseUrl: string = "http://localhost:8080"
): EmailPreviewData {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const actionUrl = `${cleanBase}/play?token=${girl.token}`;
  const subject = `🌸 [GDGoC HUST 20/10] Lời mời tham gia minigame Bloom With Us - Dành riêng cho ${girl.name}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #381A2B; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
    .card { background: #FFFFFF; border-radius: 24px; padding: 36px 28px; border: 1px solid #F5D3DE; box-shadow: 0 10px 30px rgba(224, 109, 136, 0.08); text-align: center; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background: #FDE8EF; color: #D84D74; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .title { font-size: 26px; font-weight: 800; color: #431936; margin: 0 0 12px 0; line-height: 1.3; font-family: Georgia, serif; }
    .subtitle { font-size: 14px; color: #7A5364; margin: 0 0 24px 0; line-height: 1.6; }
    .highlight-box { background: #FFF9FA; border: 1px dashed #F2B0C4; border-radius: 16px; padding: 18px; margin: 20px 0; text-align: left; }
    .highlight-box p { margin: 6px 0; font-size: 13px; color: #4F283B; }
    .btn { display: inline-block; background: linear-gradient(135deg, #EC4899 0%, #F43F5E 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.35); margin: 24px 0 16px 0; }
    .token-text { font-size: 12px; color: #9A7787; margin-top: 12px; word-break: break-all; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #A88696; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <span class="badge">GDG on Campus HUST · 20/10 Special</span>
      <h1 class="title">Bloom With Us 🌸</h1>
      <p class="subtitle">"A little code, a lot of appreciation."</p>

      <p style="font-size: 15px; color: #381A2B; text-align: left; line-height: 1.6;">
        Chào bạn <strong>${girl.name}</strong> thân mến,<br><br>
        Nhân dịp ngày Phụ nữ Việt Nam 20/10, CLB <strong>${group?.group_name || "GDGoC HUST"}</strong> gửi tới bạn những lời chúc ấm áp nhất! Toàn bộ các bạn nam đã chuẩn bị một minigame đặc biệt và những món quà bí mật dành riêng cho bạn.
      </p>

      <div class="highlight-box">
        <p><strong>Nhiệm vụ của bạn:</strong></p>
        <p>1. Bấm vào nút bên dưới để giải 5 câu hỏi minigame thú vị.</p>
        <p>2. Thu thập manh mối nhận diện nhóm bạn nam ngoài đời.</p>
        <p>3. Tìm gặp bạn nam, nhận <strong>Secret Code</strong> để mở thư chúc và nhận quà tận tay!</p>
      </div>

      <a href="${actionUrl}" class="btn" target="_blank">
        Bắt Đầu Chơi Minigame Ngay
      </a>

      <p class="token-text">
        Mã tham gia cá nhân: <strong style="color: #D84D74; font-family: monospace;">${girl.token}</strong><br>
        Nếu nút không hoạt động, bạn có thể copy link sau:<br>
        <a href="${actionUrl}" style="color: #D84D74;">${actionUrl}</a>
      </p>
    </div>

    <div class="footer">
      Google Developer Groups on Campus - Hanoi University of Science and Technology<br>
      Sự kiện nội bộ kỷ niệm ngày Phụ nữ Việt Nam 20/10.
    </div>
  </div>
</body>
</html>`;

  const plainText = `[GDGoC HUST 20/10] Bloom With Us - Lời mời dành riêng cho ${girl.name}
Chào ${girl.name},

Nhân ngày Phụ nữ Việt Nam 20/10, các bạn nam CLB ${group?.group_name || "GDGoC HUST"} gửi tới bạn lời chúc ấm áp nhất!
Hãy tham gia minigame để nhận manh mối đi tìm bạn nam và mở quà nhé:

- Link minigame: ${actionUrl}
- Mã tham gia: ${girl.token}

Chúc bạn một ngày 20/10 thật rạng rỡ và ngập tràn niềm vui!
GDGoC HUST Team`;

  return {
    recipientType: "girl",
    recipientName: girl.name,
    recipientEmail: girl.email || "",
    subject,
    htmlContent,
    plainText,
    actionUrl,
  };
}

export function generateBoyInvitationEmail(
  boy: Boy,
  group?: Group,
  baseUrl: string = "http://localhost:8080"
): EmailPreviewData {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const actionUrl = `${cleanBase}/boy?token=${boy.token || boy.id}`;
  const subject = `[GDGoC HUST 20/10] Phân công gửi lời chúc 20/10 - Dành cho ${boy.name}`;
  const assignedGirl = boy.assigned_girl_name || "bạn nữ trong nhóm";

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9FD; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
    .card { background: #FFFFFF; border-radius: 24px; padding: 36px 28px; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); text-align: center; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .title { font-size: 26px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0; line-height: 1.3; }
    .subtitle { font-size: 14px; color: #64748B; margin: 0 0 24px 0; line-height: 1.6; }
    .assignment-box { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: left; }
    .secret-code-pill { display: inline-block; font-size: 20px; font-weight: 800; color: #059669; font-family: monospace; letter-spacing: 3px; background: #ECFDF5; border: 1px dashed #10B981; padding: 6px 16px; border-radius: 12px; margin: 6px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35); margin: 20px 0 16px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <span class="badge">GDGoC HUST · Nhiệm Vụ 20/10</span>
      <h1 class="title">Xin Chào ${boy.name}!</h1>
      <p class="subtitle">Chiến dịch 20/10: "A little code, a lot of appreciation."</p>

      <p style="font-size: 14px; color: #334155; text-align: left; line-height: 1.6;">
        Chào bạn <strong>${boy.name}</strong> (${group?.group_name || "GDGoC HUST"}),<br><br>
        Sự kiện 20/10 đã bắt đầu! Dưới đây là phân công phụ trách và mã bí mật của bạn:
      </p>

      <div class="assignment-box">
        <p style="margin: 4px 0; font-size: 13px;">🎁 <strong>Bạn nữ phụ trách nhận quà:</strong> <span style="color: #E11D48; font-weight: bold;">${assignedGirl}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Mã bí mật cá nhân của bạn (Secret Code):</strong></p>
        <div style="text-align: center; margin: 10px 0;">
          <div class="secret-code-pill">${boy.secret_code || "CHƯA ĐẶT"}</div>
        </div>
        <p style="margin: 4px 0; font-size: 12px; color: #64748B;">
          <em>Lưu ý: Hãy ghi nhớ mã này! Khi bạn nữ giải xong câu hỏi và đi tìm bạn ngoài đời, bạn hãy đọc mã này để bạn nữ nhập vào web mở thư và nhận quà nhé!</em>
        </p>
      </div>

      <a href="${actionUrl}" class="btn" target="_blank">
        Mở Web Soạn Lời Chúc & Đổi Mã
      </a>

      <p style="font-size: 12px; color: #64748B; margin-top: 14px;">
        Đường dẫn riêng của bạn:<br>
        <a href="${actionUrl}" style="color: #4F46E5; word-break: break-all;">${actionUrl}</a>
      </p>
    </div>

    <div class="footer">
      Ban Tổ Chức GDG on Campus HUST · 20/10 Bloom With Us
    </div>
  </div>
</body>
</html>`;

  const plainText = `[GDGoC HUST 20/10] Nhiệm vụ gửi lời chúc 20/10 - Dành cho ${boy.name}
Chào ${boy.name},

Bạn đã được phân công gửi lời chúc và trao quà cho: ${assignedGirl}!
Mã bí mật của bạn (Secret Code): ${boy.secret_code || "CHƯA ĐẶT"}

- Link mở trang soạn lời chúc: ${actionUrl}
- Lưu ý: Giữ mã bí mật này để đọc cho bạn nữ khi gặp trực tiếp ngoài đời.

Chúc bạn và cả nhóm có một ngày 20/10 thật đáng nhớ!
GDGoC HUST Team`;

  return {
    recipientType: "boy",
    recipientName: boy.name,
    recipientEmail: boy.email || "",
    subject,
    htmlContent,
    plainText,
    actionUrl,
  };
}

export function exportAllRecipientsToCSV(
  boys: Boy[],
  girls: Girl[],
  groups: Group[],
  baseUrl: string = "http://localhost:8080"
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const headers = ["ID", "Họ Tên", "Email", "Vai Trò", "Nhóm", "Mã Token/Link", "Mã Bí Mật", "Người Ghép Đôi", "Đường Dẫn Đầy Đủ"];
  const rows: string[][] = [];

  girls.forEach((g) => {
    const grp = groups.find((grp) => grp.id === g.group_id);
    const link = `${cleanBase}/play?token=${g.token}`;
    rows.push([
      g.id,
      g.name,
      g.email || "",
      "Bạn Nữ (Chơi Minigame)",
      grp?.group_name || "",
      g.token,
      "",
      g.assigned_boy_name || "",
      link,
    ]);
  });

  boys.forEach((b) => {
    const grp = groups.find((grp) => grp.id === b.group_id);
    const link = `${cleanBase}/boy?token=${b.token || b.id}`;
    rows.push([
      b.id,
      b.name,
      b.email || "",
      "Bạn Nam (Trao Quà)",
      grp?.group_name || "",
      b.token || b.id,
      b.secret_code || "",
      b.assigned_girl_name || "",
      link,
    ]);
  });

  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function exportAllRecipientsToJSON(
  boys: Boy[],
  girls: Girl[],
  groups: Group[],
  baseUrl: string = "http://localhost:8080"
): EmailExportItem[] {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const list: EmailExportItem[] = [];

  girls.forEach((g) => {
    const grp = groups.find((grp) => grp.id === g.group_id);
    list.push({
      id: g.id,
      name: g.name,
      email: g.email || "",
      role: "girl",
      groupName: grp?.group_name || "",
      token: g.token,
      actionUrl: `${cleanBase}/play?token=${g.token}`,
      assignedPartner: g.assigned_boy_name,
    });
  });

  boys.forEach((b) => {
    const grp = groups.find((grp) => grp.id === b.group_id);
    list.push({
      id: b.id,
      name: b.name,
      email: b.email || "",
      role: "boy",
      groupName: grp?.group_name || "",
      token: b.token || b.id,
      actionUrl: `${cleanBase}/boy?token=${b.token || b.id}`,
      secretCode: b.secret_code,
      assignedPartner: b.assigned_girl_name,
    });
  });

  return list;
}
