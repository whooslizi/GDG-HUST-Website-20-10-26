"""Send each girl her 20/10 invitation (login code + minigame link) through Gmail.

Dry run by default. See mailing/README.md.
"""

import argparse
import csv
import html
import os
import re
import smtplib
import sys
import time
from email.message import EmailMessage

DEFAULT_SITE_URL = "https://www.whooslizi.dev/GDG-HUST-Website-20-10-26"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def read_recipients(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cols = [c.strip().lower() for c in (reader.fieldnames or [])]
        for need in ("code", "name", "email"):
            if need not in cols:
                raise ValueError(f'recipients CSV is missing the "{need}" column')
        reader.fieldnames = cols

        recipients = []
        for line_no, row in enumerate(reader, start=2):
            r = {k: (row.get(k) or "").strip() for k in ("code", "name", "email")}
            if not any(r.values()):
                continue
            if not r["code"] or not r["name"] or not EMAIL_RE.match(r["email"]):
                raise ValueError(f"recipients CSV line {line_no} is incomplete or has a bad email: {row}")
            recipients.append(r)
        return recipients


def pick_recipients(recipients, only):
    """`only` is a comma-separated list of codes; empty means everyone."""
    wanted = [c.strip().upper() for c in only.split(",") if c.strip()]
    if not wanted:
        return recipients
    known = {r["code"].upper() for r in recipients}
    missing = [c for c in wanted if c not in known]
    if missing:
        raise ValueError("codes not in the recipients file: " + ", ".join(missing))
    return [r for r in recipients if r["code"].upper() in wanted]


def build_email(name, code, site_url):
    link = f"{site_url.rstrip('/')}/play?token={code}"
    subject = f"[GDGoC HUST 20/10] Lời mời tham gia minigame Bloom With Us - Dành riêng cho {name}"
    n, c, l = html.escape(name), html.escape(code), html.escape(link)

    body_html = f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#381A2B;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#FFFFFF;border-radius:20px;padding:32px 28px;border:1px solid #F5D3DE;">
      <p style="margin:0 0 8px;font-size:12px;color:#9A7787;">GDG on Campus HUST · 20/10</p>
      <h1 style="margin:0 0 20px;font-size:24px;font-family:Georgia,serif;color:#431936;">Bloom With Us</h1>

      <p style="font-size:15px;line-height:1.6;">
        Chào bạn <strong>{n}</strong> thân mến,<br><br>
        Nhân dịp ngày Phụ nữ Việt Nam 20/10, CLB <strong>GDGoC HUST</strong> gửi tới bạn những lời chúc ấm áp nhất!
        Các bạn nam đã chuẩn bị một minigame nhỏ và những lời chúc bí mật dành cho bạn.
      </p>

      <div style="background:#FFF9FA;border:1px dashed #F2B0C4;border-radius:14px;padding:16px;margin:20px 0;font-size:13px;color:#4F283B;line-height:1.7;">
        <strong>Cách chơi:</strong><br>
        1. Bấm nút bên dưới và đăng nhập bằng mã của bạn.<br>
        2. Giải 5 câu hỏi minigame.<br>
        3. Lên Cây Ước Nguyện, tìm bạn nam để nhận mã mở thư.
      </div>

      <p style="text-align:center;margin:28px 0 12px;">
        <a href="{l}" style="display:inline-block;background:#D94B76;color:#FFFFFF;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:14px;">Bắt đầu chơi</a>
      </p>

      <p style="text-align:center;font-size:12px;color:#9A7787;line-height:1.6;">
        Mã của bạn: <strong style="color:#D94B76;font-family:monospace;font-size:14px;">{c}</strong><br>
        Nếu nút không hoạt động, mở link: <a href="{l}" style="color:#D94B76;">{l}</a>
      </p>
    </div>
    <p style="text-align:center;margin-top:20px;font-size:11px;color:#A88696;">
      Google Developer Groups on Campus - Hanoi University of Science and Technology
    </p>
  </div>
</body>
</html>"""

    body_text = f"""Chào {name},

Nhân ngày Phụ nữ Việt Nam 20/10, CLB GDGoC HUST gửi tới bạn lời chúc ấm áp nhất!
Hãy tham gia minigame và lên Cây Ước Nguyện để mở lời chúc nhé:

- Link: {link}
- Mã của bạn: {code}

Chúc bạn một ngày 20/10 thật rạng rỡ!
GDGoC HUST"""

    return subject, body_html, body_text, link


def main(argv=None):
    p = argparse.ArgumentParser(description="Send 20/10 invitations through Gmail.")
    p.add_argument("--file", default="mailing/recipients.csv", help="recipients CSV (code,name,email)")
    p.add_argument("--only", default=os.environ.get("ONLY", ""), help="comma-separated codes; empty = everyone")
    p.add_argument("--send", action="store_true", help="really send (default is a dry run)")
    args = p.parse_args(argv)

    site_url = os.environ.get("SITE_URL") or DEFAULT_SITE_URL
    recipients = pick_recipients(read_recipients(args.file), args.only)
    print(f"{len(recipients)} recipient(s) from {args.file}" + ("" if args.send else " (dry run, add --send to deliver)"))

    if not args.send:
        for r in recipients:
            *_, link = build_email(r["name"], r["code"], site_url)
            print(f"  would send to {r['name']} <{r['email']}>: {link}")
        return 0

    user = os.environ.get("GMAIL_USER")
    password = os.environ.get("GMAIL_APP_PASSWORD")
    if not user or not password:
        raise ValueError("set GMAIL_USER and GMAIL_APP_PASSWORD to send")

    failed = []
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(user, password)
        for r in recipients:
            subject, body_html, body_text, _ = build_email(r["name"], r["code"], site_url)
            msg = EmailMessage()
            msg["From"] = f"GDG HUST <{user}>"
            msg["To"] = r["email"]
            msg["Subject"] = subject
            msg.set_content(body_text)
            msg.add_alternative(body_html, subtype="html")
            try:
                smtp.send_message(msg)
                print(f"  sent to {r['name']} <{r['email']}>")
            except smtplib.SMTPException as err:
                failed.append(r["code"])
                print(f"  FAILED {r['name']} <{r['email']}>: {err}", file=sys.stderr)
            # Gmail throttles bursts; a short pause keeps a few dozen mails well under the limit.
            time.sleep(1)

    if failed:
        print(f"{len(failed)} mail(s) failed. Re-run with: --only {','.join(failed)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, smtplib.SMTPException) as err:
        print(f"error: {err}", file=sys.stderr)
        sys.exit(1)
