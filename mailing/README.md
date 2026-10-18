# Mailing

Sends each girl her invitation email (her login code and a link to the minigame) through Gmail.
One Python file, `send.py`, with nothing to install: it only uses Python's built-in libraries (Python 3.9+).
To change the email wording, edit `build_email` in `send.py`.

It never sends unless you ask: without `--send` (or the "send" box in GitHub Actions) it only prints who would get mail.

## 1. Get a Gmail app password

Gmail does not accept your normal password from scripts. You need an app password:

1. Use the Gmail account that should send the mail (e.g. the club account).
2. Turn on 2-Step Verification: Google Account → Security → 2-Step Verification.
3. Open https://myaccount.google.com/apppasswords, create one named `GDG mailing`.
4. Copy the 16-character password. You will not see it again.

Limits: a normal Gmail account can send about 500 emails a day, so 34 is fine.

## 2. Make the recipients list

A CSV with three columns: `code`, `name`, `email`. The code must match the girl's `token` in the Supabase `girls` table.

```csv
code,name,email
KTRMX,Phạm Hiền Minh,hienminh@example.com
PLQWZ,Đinh Phương Mai,phuongmai@example.com
```

See `recipients.example.csv`. You can make it in Excel or Google Sheets and export as CSV (UTF-8).

**Do not commit the real list.** The repo is public and these are personal emails.
`mailing/recipients.csv` is already in `.gitignore`.

## 3a. Send from your computer

```bash
cp mailing/recipients.example.csv mailing/recipients.csv   # then fill in real emails

# Dry run: lists who would get mail and their links
python3 mailing/send.py

# Only some people (comma-separated codes, any case)
python3 mailing/send.py --only KTRMX,PLQWZ

# Really send
GMAIL_USER=club.account@gmail.com GMAIL_APP_PASSWORD='abcd efgh ijkl mnop' python3 mailing/send.py --only KTRMX --send

# Use a different list file
python3 mailing/send.py --file path/to/list.csv
```

Tip: send to yourself first. Add a row with your own email and any code, then `--only` that code.

## 3b. Send from GitHub Actions

Add these in the repo: Settings → Secrets and variables → Actions → New repository secret.

| Secret | Value |
|---|---|
| `GMAIL_USER` | The sending Gmail address |
| `GMAIL_APP_PASSWORD` | The app password from step 1 |
| `RECIPIENTS_CSV` | The whole content of your recipients CSV, header line included |

Optional: a repository **variable** (not secret) `SITE_URL` if the site moves.
The default is `https://www.whooslizi.dev/GDG-HUST-Website-20-10-26`.

Then: Actions tab → "Send mail" → Run workflow.

- **only**: codes to mail, e.g. `KTRMX,PLQWZ`. Leave empty to mail everyone in the list.
- **send**: leave unchecked first. The log shows who would get mail. Run again with it checked to send.

## If something fails

- `Invalid login` / `Username and Password not accepted`: wrong app password, or 2-Step Verification is off.
- `codes not in the recipients file`: a code in `only` is not in the CSV.
- `line N is incomplete or has a bad email`: fix that line of the CSV.
- Some mails failed: the run ends with an error and prints the exact `--only ...` to re-send just those.

## Tests

```bash
python3 mailing/test_send.py
```
