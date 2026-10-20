import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { verifyPassword } from "@better-auth/utils/password";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, ".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}
const pool = new pg.Pool({
  connectionString: (env.DATABASE_URL || "").replace(/[?&]sslmode=require/, ""),
  ssl: { rejectUnauthorized: false },
});

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const q = (text, params) => pool.query(text, params);

// 1. counts
const counts = {};
for (const t of ["users", "classes", "subjects", "teacher_assignments", "tasks", "notifications"]) {
  const { rows } = await q(`SELECT COUNT(*)::int AS n FROM ${t}`);
  counts[t] = rows[0].n;
}
console.log("Counts:", JSON.stringify(counts));

// 2. Haidar assignments
const { rows: haidar } = await q(`SELECT id, name FROM users WHERE email = 'haidar@agendakita.test'`);
check("Akun Haidar ada", haidar.length === 1);
const haidarId = haidar[0]?.id;

const { rows: haidarAssign } = await q(
  `SELECT c.name AS class_name, s.name AS subject_name
   FROM teacher_assignments ta
   JOIN classes c ON c.id = ta.class_id
   JOIN subjects s ON s.id = ta.subject_id
   WHERE ta.teacher_id = $1 ORDER BY c.name, s.name`,
  [haidarId]
);
const expectedHaidar = [
  "RPL 1|Pemrograman",
  "RPL 2|Pemrograman",
  "RPL 3|Basis Data",
  "RPL 4|Pemrograman",
  "RPL 5|Basis Data",
];
const gotHaidar = haidarAssign.map((r) => `${r.class_name}|${r.subject_name}`);
check(
  "Haidar punya 5 penugasan sesuai spesifikasi",
  expectedHaidar.every((e) => gotHaidar.includes(e)) && gotHaidar.length === 5,
  gotHaidar.join(", ")
);

// 3. Nadia & Fajar
const { rows: nadiaA } = await q(
  `SELECT c.name || '|' || s.name AS combo FROM teacher_assignments ta
   JOIN classes c ON c.id = ta.class_id JOIN subjects s ON s.id = ta.subject_id
   JOIN users u ON u.id = ta.teacher_id WHERE u.email = 'nadia@agendakita.test'`
);
check(
  "Nadia punya 3 penugasan",
  nadiaA.length === 3 &&
    ["RPL 1|Basis Data", "RPL 2|Basis Data", "RPL 3|Pemrograman"].every((e) =>
      nadiaA.some((r) => r.combo === e)
    ),
  nadiaA.map((r) => r.combo).join(", ")
);

const { rows: fajarA } = await q(
  `SELECT c.name || '|' || s.name AS combo FROM teacher_assignments ta
   JOIN classes c ON c.id = ta.class_id JOIN subjects s ON s.id = ta.subject_id
   JOIN users u ON u.id = ta.teacher_id WHERE u.email = 'fajar@agendakita.test'`
);
check(
  "Fajar punya 2 penugasan",
  fajarA.length === 2 &&
    ["RPL 4|Basis Data", "RPL 5|Pemrograman"].every((e) => fajarA.some((r) => r.combo === e)),
  fajarA.map((r) => r.combo).join(", ")
);

// 4. Students per class
const { rows: studentPerClass } = await q(
  `SELECT c.name, COUNT(u.id)::int AS n
   FROM classes c LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student'
   WHERE c.name IN ('RPL 1','RPL 2','RPL 3','RPL 4','RPL 5')
   GROUP BY c.name ORDER BY c.name`
);
check(
  "Setiap kelas RPL punya 3 siswa",
  studentPerClass.length === 5 && studentPerClass.every((r) => r.n === 3),
  studentPerClass.map((r) => `${r.name}:${r.n}`).join(", ")
);

// 5. Priority task
const { rows: pt } = await q(
  `SELECT t.*, c.name AS class_name, s.name AS subject_name, u.name AS teacher_name,
          to_char(t.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date_text
   FROM tasks t
   JOIN classes c ON c.id = t.class_id
   LEFT JOIN subjects s ON s.id = t.subject_id
   LEFT JOIN users u ON u.id = t.teacher_id
   WHERE t.title = 'Pengumpulan Praktikum Pemrograman Dasar'`
);
check("Tugas prioritas tepat 1 record", pt.length === 1, `count=${pt.length}`);
if (pt.length === 1) {
  const p = pt[0];
  check("Tugas prioritas: kelas RPL 1", p.class_name === "RPL 1");
  check("Tugas prioritas: mata pelajaran Pemrograman", p.subject_name === "Pemrograman");
  check("Tugas prioritas: guru Haidar", p.teacher_name === "Haidar Ramadhan");
  check(
    "Tugas prioritas: due_date 2026-10-22 06:00 WIB (wall-clock)",
    p.due_date_text === "2026-10-22T06:00:00",
    p.due_date_text
  );
  check("Tugas prioritas: reminder offset 1 jam", p.reminder_offset_hours === 1);
  check("Tugas prioritas: is_notified=false (siap dikirim cron)", p.is_notified === false);
  check("Tugas prioritas: notification_status pending", p.notification_status === "pending");
  check("Tugas prioritas: details JSONB terisi", Array.isArray(p.details) && p.details.length === 2);
}

// 6. total tasks seed = 6 with expected distribution
const { rows: seedTasks } = await q(
  `SELECT t.title, c.name AS class_name, s.name AS subject_name, u.email AS teacher_email,
          to_char(t.due_date, 'YYYY-MM-DD HH24:MI') AS due, t.reminder_offset_hours
   FROM tasks t
   JOIN classes c ON c.id = t.class_id
   LEFT JOIN subjects s ON s.id = t.subject_id
   LEFT JOIN users u ON u.id = t.teacher_id
   WHERE c.name IN ('RPL 1','RPL 2','RPL 3','RPL 4','RPL 5')
   ORDER BY c.name, t.title`
);
check("Ada 6 tugas di kelas RPL", seedTasks.length === 6, seedTasks.map((t) => `${t.class_name}:${t.title}`).join(" | "));

// teacher-task validity: every task's teacher teaches that class+subject
let allValid = true;
for (const t of seedTasks) {
  const { rows: v } = await q(
    `SELECT 1 FROM teacher_assignments ta
     JOIN users u ON u.id = ta.teacher_id
     JOIN classes c ON c.id = ta.class_id
     LEFT JOIN subjects s ON s.id = ta.subject_id
     WHERE u.email = $1 AND c.name = $2 AND s.name = $3`,
    [t.teacher_email, t.class_name, t.subject_name]
  );
  if (v.length === 0) {
    allValid = false;
    console.log(`  invalid: ${t.title} by ${t.teacher_email} for ${t.class_name}/${t.subject_name}`);
  }
}
check("Semua tugas dibuat guru yang mengajar kelas+mata pelajaran tsb", allValid);

// 7. password hash works (Better Auth compatible)
const { rows: acc } = await q(
  `SELECT a.password, u.email FROM accounts a JOIN users u ON u.id = a.user_id
   WHERE u.email = 'haidar@agendakita.test' AND a.provider_id = 'credential'`
);
let pwOk = false;
if (acc.length === 1) {
  pwOk = await verifyPassword(acc[0].password, "AgendaKita2026!");
}
check("Password hash kompatibel Better Auth (login bisa)", pwOk);

// 8. every seeded user has credential account
const { rows: noCred } = await q(
  `SELECT u.email FROM users u
   WHERE u.email LIKE '%@agendakita.test'
     AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id = u.id AND a.provider_id = 'credential' AND a.password IS NOT NULL)`
);
check("Semua akun .test punya credential password", noCred.length === 0, noCred.map((r) => r.email).join(","));

// 9. notifications exist for RPL 1 students on priority task
const { rows: notif } = await q(
  `SELECT COUNT(*)::int AS n FROM notifications n
   JOIN users u ON u.id = n.user_id
   JOIN tasks t ON t.id = n.task_id
   WHERE t.title = 'Pengumpulan Praktikum Pemrograman Dasar'
     AND n.kind = 'task_published' AND u.role = 'student'`
);
check("Notifikasi task_published untuk 3 siswa RPL 1", notif[0].n === 3, `n=${notif[0].n}`);

// 10. cron window simulation for priority task
const { rows: window } = await q(
  `SELECT
     (t.due_date - make_interval(hours => t.reminder_offset_hours)) AS window_start,
     t.due_date AS deadline,
     (t.due_date - make_interval(hours => t.reminder_offset_hours) <= ('2026-10-22 05:00:30'::timestamp)) AS in_window_at_0500,
     (t.due_date > ('2026-10-22 05:00:30'::timestamp)) AS not_expired_at_0500,
     (t.due_date - make_interval(hours => t.reminder_offset_hours) <= ('2026-10-22 04:59:00'::timestamp)) AS in_window_at_0459
   FROM tasks t WHERE t.title = 'Pengumpulan Praktikum Pemrograman Dasar'`
);
const w = window[0];
check(
  "Jendela reminder terbuka tepat pukul 05:00 WIB (bukan 04:59)",
  w.in_window_at_0500 === true && w.not_expired_at_0500 === true && w.in_window_at_0459 === false,
  `window_start=${w.window_start.toISOString()}`
);

// 11. no other students would be picked for priority task
const { rows: cronRecipients } = await q(
  `SELECT u.email FROM users u
   JOIN tasks t ON u.class_id = t.class_id
   WHERE t.title = 'Pengumpulan Praktikum Pemrograman Dasar' AND u.role = 'student'
   ORDER BY u.email`
);
check(
  "Kueri penerima cron hanya 3 siswa RPL 1",
  cronRecipients.length === 3 && cronRecipients.every((r) => r.email.endsWith(".rpl1@agendakita.test")),
  cronRecipients.map((r) => r.email).join(", ")
);

console.log(`\n${failures === 0 ? "SEMUA PEMERIKSAAN LULUS" : `${failures} PEMERIKSAAN GAGAL`}`);
await pool.end();
process.exit(failures === 0 ? 0 : 1);
