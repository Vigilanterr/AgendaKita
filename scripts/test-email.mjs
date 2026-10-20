import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import nodemailer from "nodemailer";
import {
  buildReminderHtml,
  buildReminderSubject,
  formatRemaining,
} from "../src/lib/reminder-email.ts";

const { Pool } = pg;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ */
/* Env                                                                  */
/* ------------------------------------------------------------------ */

function readEnv() {
  const raw = readFileSync(join(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = readEnv();
const connectionString = (env.DATABASE_URL || "").replace(
  /[?&]sslmode=require/,
  ""
);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const mode = args[0] || "dry-run";
const toIndex = args.indexOf("--to");
const toList =
  toIndex >= 0 && args[toIndex + 1]
    ? args[toIndex + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

const PRIORITY_TASK_TITLE = "Pengumpulan Praktikum Pemrograman Dasar";

const EMAIL_OK_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(email) {
  const [user, domain] = email.split("@");
  const head = user.slice(0, Math.min(2, user.length));
  return `${head}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

function buildTransport() {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    return { error: "EMAIL_USER / EMAIL_PASS belum di-set di .env" };
  }
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
  return { transport };
}

async function loadPriorityTask() {
  const { rows } = await pool.query(
    `SELECT
       t.id,
       t.title,
       t.description,
       to_char(t.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date,
       t.class_id,
       c.name AS class_name,
       u.name AS teacher_name,
       s.name AS subject_name
     FROM tasks t
     JOIN classes c ON t.class_id = c.id
     LEFT JOIN users u ON t.teacher_id = u.id
     LEFT JOIN subjects s ON t.subject_id = s.id
     WHERE t.title = $1
     ORDER BY t.id
     LIMIT 1`,
    [PRIORITY_TASK_TITLE]
  );
  return rows[0] ?? null;
}

async function loadRecipients(classId) {
  const { rows } = await pool.query(
    `SELECT email, name FROM users
     WHERE class_id = $1 AND role = 'student'
     ORDER BY email`,
    [classId]
  );
  return rows;
}

async function loadExcludedStudents(classId) {
  const { rows } = await pool.query(
    `SELECT email, name FROM users
     WHERE role = 'student' AND (class_id IS NULL OR class_id <> $1)
       AND email LIKE '%@agendakita.test'
     ORDER BY email`,
    [classId]
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* Modes                                                                */
/* ------------------------------------------------------------------ */

async function modeVerify() {
  console.log("=== Verifikasi konfigurasi SMTP ===");
  console.log(`EMAIL_USER   : ${env.EMAIL_USER ? maskEmail(env.EMAIL_USER) : "(belum di-set)"}`);
  console.log(`EMAIL_PASS   : ${env.EMAIL_PASS ? `tersedia (${env.EMAIL_PASS.length} karakter)` : "(belum di-set)"}`);

  const { transport, error } = buildTransport();
  if (error) {
    console.error(`GAGAL: ${error}`);
    process.exitCode = 1;
    return;
  }

  try {
    await transport.verify();
    console.log("HASIL: Konfigurasi SMTP valid — server menerima kredensial.");
  } catch (err) {
    console.error(`GAGAL: Verifikasi SMTP ditolak — ${err.message}`);
    process.exitCode = 1;
  }
}

async function modeDryRun() {
  console.log("=== Dry-run email pengingat (TIDAK mengirim email) ===\n");

  const task = await loadPriorityTask();
  if (!task) {
    console.error(`Tugas prioritas "${PRIORITY_TASK_TITLE}" tidak ditemukan di database. Jalankan seed dulu.`);
    process.exitCode = 1;
    return;
  }

  const recipients = await loadRecipients(task.class_id);
  const excluded = await loadExcludedStudents(task.class_id);
  const appUrl =
    env.NEXT_PUBLIC_APP_URL ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");

  const subject = buildReminderSubject(task);
  const html = buildReminderHtml(task, appUrl);

  console.log(`Tugas        : ${task.title} (id ${task.id})`);
  console.log(`Kelas        : ${task.class_name}`);
  console.log(`Guru         : ${task.teacher_name}`);
  console.log(`Mata pelajaran: ${task.subject_name}`);
  console.log(`Deadline     : ${task.due_date.replace("T", " ")} WIB (wall-clock tersimpan)`);
  console.log(`Sisa waktu   : ${formatRemaining(task.due_date)}`);
  console.log(`Subject      : ${subject}`);
  console.log(`\nPenerima (BCC, ${recipients.length} siswa kelas ${task.class_name}):`);
  for (const r of recipients) console.log(`  + ${maskEmail(r.email)} (${r.name})`);

  console.log(`\nBukan penerima (${excluded.length} siswa kelas lain — diverifikasi TIDAK masuk daftar):`);
  for (const e of excluded.slice(0, 5)) console.log(`  - ${maskEmail(e.email)} (${e.name})`);
  if (excluded.length > 5) console.log(`  ... dan ${excluded.length - 5} lainnya`);

  const escapedHtml = html;
  console.log(`\nUkuran html  : ${escapedHtml.length} karakter`);
  console.log(`Link agenda  : ${appUrl.replace(/\/$/, "")}/student/agenda`);
  console.log("\nDry-run selesai. Tidak ada email yang dikirim.");
  console.log("Untuk kirim sungguhan ke alamat yang Anda kendalikan:");
  console.log("  node scripts/test-email.mjs send --to alamat-anda@domain.com");
}

async function modeSend() {
  console.log("=== Kirim email pengingat (terkontrol) ===\n");

  if (toList.length === 0) {
    console.error(
      "TOLAK: Mode send memerlukan --to <alamat> yang eksplisit.\n" +
        "Contoh: node scripts/test-email.mjs send --to anda@domain.com"
    );
    process.exitCode = 1;
    return;
  }

  for (const addr of toList) {
    if (!EMAIL_OK_PATTERN.test(addr)) {
      console.error(`TOLAK: Format email tidak valid — ${addr}`);
      process.exitCode = 1;
      return;
    }
  }

  const task = await loadPriorityTask();
  if (!task) {
    console.error(`Tugas prioritas "${PRIORITY_TASK_TITLE}" tidak ditemukan di database. Jalankan seed dulu.`);
    process.exitCode = 1;
    return;
  }

  const recipients = await loadRecipients(task.class_id);
  const appUrl =
    env.NEXT_PUBLIC_APP_URL ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");

  const { transport, error } = buildTransport();
  if (error) {
    console.error(`GAGAL: ${error}`);
    process.exitCode = 1;
    return;
  }

  const subject = buildReminderSubject(task);
  const html = buildReminderHtml(task, appUrl);

  // Penerima uji hanya alamat yang diberikan secara eksplisit —
  // bukan daftar siswa massal.
  try {
    const info = await transport.sendMail({
      from: `"AgendaKita" <${env.EMAIL_USER}>`,
      to: toList,
      subject: `[UJI] ${subject}`,
      html,
      text: `Pengingat tugas: ${task.title}\nKelas: ${task.class_name}\nGuru: ${task.teacher_name}\nDeadline: ${task.due_date.replace("T", " ")} WIB\nSisa waktu: ${formatRemaining(task.due_date)}\nBuka agenda: ${appUrl.replace(/\/$/, "")}/student/agenda`,
    });

    console.log("Pengiriman sukses.");
    console.log(`  Message-ID : ${info.messageId}`);
    console.log(`  Response   : ${info.response ? String(info.response).split("\n")[0] : "-"}`);
    console.log(`  Penerima   : ${toList.join(", ")}`);
    console.log(`  Subject    : [UJI] ${subject}`);
    console.log(`\nCatatan: email nyata ke siswa hanya dikirim oleh cron /api/cron/reminder,`);
    console.log(`bukan oleh skrip ini. Penerima cron: ${recipients.length} siswa kelas ${task.class_name}.`);
  } catch (err) {
    console.error(`GAGAL mengirim: ${err.message}`);
    console.error("Periksa EMAIL_USER/EMAIL_PASS (app password Gmail) dan koneksi jaringan.");
    process.exitCode = 1;
  }
}

/* ------------------------------------------------------------------ */

async function main() {
  if (mode === "verify") {
    await modeVerify();
  } else if (mode === "dry-run") {
    await modeDryRun();
  } else if (mode === "send") {
    await modeSend();
  } else {
    console.error(`Mode tidak dikenal: ${mode}`);
    console.error("Penggunaan: node scripts/test-email.mjs [verify|dry-run|send] [--to alamat@domain.com]");
    process.exitCode = 1;
  }
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("Skrip gagal:", error.message);
    await pool.end();
    process.exit(1);
  });
