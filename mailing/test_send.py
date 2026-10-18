import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from send import build_email, pick_recipients, read_recipients  # noqa: E402

CSV = "code,name,email\nKTRMX,Phạm Hiền Minh,minh@example.com\nPLQWZ,\"Đinh Phương Mai\",mai@example.com\n"


def write(text):
    f = tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8")
    f.write(text)
    f.close()
    return f.name


class SendTest(unittest.TestCase):
    def test_reads_recipients(self):
        rows = read_recipients(write(CSV))
        self.assertEqual(rows[0], {"code": "KTRMX", "name": "Phạm Hiền Minh", "email": "minh@example.com"})
        self.assertEqual(len(rows), 2)

    def test_rejects_bad_email(self):
        with self.assertRaisesRegex(ValueError, "line 2"):
            read_recipients(write("code,name,email\nKTRMX,Minh,not-an-email\n"))

    def test_picks_only_listed_codes(self):
        rows = read_recipients(write(CSV))
        self.assertEqual(len(pick_recipients(rows, "")), 2)
        self.assertEqual([r["name"] for r in pick_recipients(rows, " plqwz ")], ["Đinh Phương Mai"])
        with self.assertRaisesRegex(ValueError, "NOPE1"):
            pick_recipients(rows, "NOPE1")

    def test_email_has_code_link_and_escapes_name(self):
        _, body_html, body_text, link = build_email("<b>Mai</b>", "PLQWZ", "https://site.dev/app/")
        self.assertEqual(link, "https://site.dev/app/play?token=PLQWZ")
        self.assertIn("&lt;b&gt;Mai&lt;/b&gt;", body_html)
        self.assertIn("PLQWZ", body_text)


if __name__ == "__main__":
    unittest.main()
