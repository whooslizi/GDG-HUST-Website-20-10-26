// Local-only live view of the girls' quiz progress and finish order.
// Run: npm run progress  ->  http://127.0.0.1:4545
// Needs SUPABASE_SERVICE_ROLE_KEY in .env (secure.sql hides girls from the anon key). Never VITE_-prefix it.
import http from "node:http";

const URL_ = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function progress() {
  const [girls, groups] = await Promise.all([
    rest("girls?select=name,group_id,quiz_group,current_question_index,wrong_attempts,stage,completed_at&or=(is_checker.is.null,is_checker.eq.false)"),
    rest("groups?select=id,group_name"),
  ]);
  const groupName = Object.fromEntries(groups.map((g) => [g.id, g.group_name]));
  return girls.map((g) => ({ ...g, group: groupName[g.group_id] || g.quiz_group || "" }));
}

const PAGE = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Quiz progress</title>
<style>
body{font:14px system-ui,sans-serif;margin:24px;background:#fafafa;color:#222}
h2{margin:24px 0 8px}table{border-collapse:collapse;width:100%;background:#fff}
th,td{padding:6px 10px;border-bottom:1px solid #eee;text-align:left}th{background:#f0f0f0}
.done{color:#0a7a2f;font-weight:600}.idle{color:#999}#err{color:#c00}
</style></head><body>
<h1>Quiz progress <small id="t" class="idle"></small></h1><div id="err"></div>
<h2>🏆 Finish order</h2><table id="fin"></table>
<h2>In progress</h2><table id="live"></table>
<script>
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const time = (s) => new Date(s).toLocaleTimeString("vi-VN");
async function tick() {
  try {
    const rows = await (await fetch("/data")).json();
    if (rows.error) throw new Error(rows.error);
    const fin = rows.filter((g) => g.completed_at).sort((a, b) => a.completed_at.localeCompare(b.completed_at));
    const live = rows.filter((g) => !g.completed_at)
      .sort((a, b) => b.current_question_index - a.current_question_index || a.name.localeCompare(b.name));
    document.getElementById("fin").innerHTML = "<tr><th>#</th><th>Name</th><th>Group</th><th>Finished at</th></tr>" +
      fin.map((g, i) => "<tr><td>" + (i + 1) + "</td><td class=done>" + esc(g.name) + "</td><td>" + esc(g.group) + "</td><td>" + time(g.completed_at) + "</td></tr>").join("");
    document.getElementById("live").innerHTML = "<tr><th>Name</th><th>Group</th><th>Question</th><th>Wrong tries</th><th>Stage</th></tr>" +
      live.map((g) => "<tr class=" + (g.stage === "not_started" ? "idle" : "") + "><td>" + esc(g.name) + "</td><td>" + esc(g.group) + "</td><td>" +
        (g.stage === "not_started" ? "–" : "Câu " + (g.current_question_index + 1)) + "</td><td>" + g.wrong_attempts + "</td><td>" + esc(g.stage) + "</td></tr>").join("");
    document.getElementById("t").textContent = "updated " + new Date().toLocaleTimeString("vi-VN");
    document.getElementById("err").textContent = "";
  } catch (e) { document.getElementById("err").textContent = e.message; }
}
tick(); setInterval(tick, 3000);
</script></body></html>`;

http
  .createServer(async (req, res) => {
    if (req.url === "/data") {
      try {
        const body = JSON.stringify(await progress());
        res.writeHead(200, { "content-type": "application/json" }).end(body);
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: e.message }));
      }
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE);
  })
  // 127.0.0.1 only: the service key must never be reachable from the network.
  .listen(4545, "127.0.0.1", () => console.log("Quiz progress: http://127.0.0.1:4545"));
