import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { hashPassword } from "@better-auth/utils/password";

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

if (!connectionString) {
  console.error("DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const DRY_RUN = !process.argv.includes("--yes");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Semua query berjalan lewat ctx. Pada mode dry-run ctx adalah klien
// transaksi yang di-rollback sehingga tidak ada data yang tertulis.
let ctx = pool;

/* ------------------------------------------------------------------ */
/* Data pengujian (identitas stabil, email domain .test tidak deliver)  */
/* ------------------------------------------------------------------ */

const TEST_PASSWORD = env.SEED_PASSWORD || "AgendaKita2026!";

const CLASS_NAMES = ["RPL 1", "RPL 2", "RPL 3", "RPL 4", "RPL 5"];

const SUBJECTS = [
  { name: "Pemrograman", code: "PGR" },
  { name: "Basis Data", code: "DBD" },
];

const TEACHERS = [
  { id: "seed-teacher-haidar", name: "Haidar Ramadhan", email: "haidar@agendakita.test" },
  { id: "seed-teacher-nadia", name: "Nadia Putri", email: "nadia@agendakita.test" },
  { id: "seed-teacher-fajar", name: "Fajar Nugroho", email: "fajar@agendakita.test" },
];

const STUDENTS = [
  { id: "seed-student-rpl1-01", name: "Ali Akbar", email: "ali.rpl1@agendakita.test", className: "RPL 1" },
  { id: "seed-student-rpl1-02", name: "Bella Safira", email: "bella.rpl1@agendakita.test", className: "RPL 1" },
  { id: "seed-student-rpl1-03", name: "Citra Ayu", email: "citra.rpl1@agendakita.test", className: "RPL 1" },
  { id: "seed-student-rpl2-01", name: "Dimas Prayoga", email: "dimas.rpl2@agendakita.test", className: "RPL 2" },
  { id: "seed-student-rpl2-02", name: "Elsa Melati", email: "elsa.rpl2@agendakita.test", className: "RPL 2" },
  { id: "seed-student-rpl2-03", name: "Fajar Ardiansyah", email: "fajar.s.rpl2@agendakita.test", className: "RPL 2" },
  { id: "seed-student-rpl3-01", name: "Gita Nirmala", email: "gita.rpl3@agendakita.test", className: "RPL 3" },
  { id: "seed-student-rpl3-02", name: "Hendra Wijaya", email: "hendra.rpl3@agendakita.test", className: "RPL 3" },
  { id: "seed-student-rpl3-03", name: "Indah Permata", email: "indah.rpl3@agendakita.test", className: "RPL 3" },
  { id: "seed-student-rpl4-01", name: "Joko Santoso", email: "joko.rpl4@agendakita.test", className: "RPL 4" },
  { id: "seed-student-rpl4-02", name: "Kartika Dewi", email: "kartika.rpl4@agendakita.test", className: "RPL 4" },
  { id: "seed-student-rpl4-03", name: "Lukman Hakim", email: "lukman.rpl4@agendakita.test", className: "RPL 4" },
  { id: "seed-student-rpl5-01", name: "Maya Lestari", email: "maya.rpl5@agendakita.test", className: "RPL 5" },
  { id: "seed-student-rpl5-02", name: "Naufal Ibrahim", email: "naufal.rpl5@agendakita.test", className: "RPL 5" },
  { id: "seed-student-rpl5-03", name: "Octaviana Sari", email: "octa.rpl5@agendakita.test", className: "RPL 5" },
];

// due_date disimpan sebagai wall-clock WIB (timestamp WITHOUT TIME ZONE),
// konsisten dengan cara aplikasi menyimpan dan membandingkan tenggat.
const ASSIGNMENTS = [
  { teacherId: "seed-teacher-haidar", className: "RPL 1", subjectName: "Pemrograman" },
  { teacherId: "seed-teacher-haidar", className: "RPL 2", subjectName: "Pemrograman" },
  { teacherId: "seed-teacher-haidar", className: "RPL 3", subjectName: "Basis Data" },
  { teacherId: "seed-teacher-haidar", className: "RPL 4", subjectName: "Pemrograman" },
  { teacherId: "seed-teacher-haidar", className: "RPL 5", subjectName: "Basis Data" },
  { teacherId: "seed-teacher-nadia", className: "RPL 1", subjectName: "Basis Data" },
  { teacherId: "seed-teacher-nadia", className: "RPL 2", subjectName: "Basis Data" },
  { teacherId: "seed-teacher-nadia", className: "RPL 3", subjectName: "Pemrograman" },
  { teacherId: "seed-teacher-fajar", className: "RPL 4", subjectName: "Basis Data" },
  { teacherId: "seed-teacher-fajar", className: "RPL 5", subjectName: "Pemrograman" },
];

const TASKS = [
  {
    title: "Praktikum Pemrograman",
    description:
      "Kerjakan latihan praktikum sesuai materi yang sudah dipelajari di kelas. Pastikan seluruh instruksi dikerjakan dan dikumpulkan sebelum tenggat.",
    className: "RPL 1",
    subjectName: "Pemrograman",
    teacherId: "seed-teacher-haidar",
    dueDate: "2026-10-27 23:59:00",
    reminderOffsetHours: 24,
    details: [
      { key: "Format", value: "Kode program diarsipkan sebagai .zip" },
      { key: "Nama file", value: "namakelas_namasiswa.zip" },
    ],
  },
  {
    title: "Latihan Query SQL",
    description:
      "Kerjakan soal latihan query SELECT, JOIN, dan GROUP BY pada skema latihan yang diberikan di kelas.",
    className: "RPL 2",
    subjectName: "Basis Data",
    teacherId: "seed-teacher-nadia",
    dueDate: "2026-10-26 23:59:00",
    reminderOffsetHours: 24,
    details: [{ key: "Jumlah soal", value: "10 soal" }],
  },
  {
    title: "Laporan Basis Data",
    description:
      "Buat laporan analisis basis data meliputi ERD, normalisasi, dan implementasi tabel beserta relasinya.",
    className: "RPL 3",
    subjectName: "Basis Data",
    teacherId: "seed-teacher-haidar",
    dueDate: "2026-10-29 23:59:00",
    reminderOffsetHours: 3,
    details: [
      { key: "Format", value: "PDF" },
      { key: "Panjang", value: "Minimal 5 halaman" },
    ],
  },
  {
    title: "Implementasi CRUD",
    description:
      "Implementasikan operasi Create, Read, Update, dan Delete pada aplikasi sederhana sesuai studi kasus kelas.",
    className: "RPL 4",
    subjectName: "Pemrograman",
    teacherId: "seed-teacher-haidar",
    dueDate: "2026-11-02 23:59:00",
    reminderOffsetHours: 24,
    details: [{ key: "Fitur minimum", value: "Tambah, ubah, hapus, dan tampil data" }],
  },
  {
    title: "Evaluasi Struktur Database",
    description:
      "Evaluasi struktur database contoh, temukan masalah normalisasi, dan usulkan perbaikan skema.",
    className: "RPL 5",
    subjectName: "Basis Data",
    teacherId: "seed-teacher-haidar",
    dueDate: "2026-11-04 23:59:00",
    reminderOffsetHours: 24,
    details: [{ key: "Ketentuan", value: "Sertakan tabel sebelum dan sesudah perbaikan" }],
  },
  {
    title: "Pengumpulan Praktikum Pemrograman Dasar",
    description:
      "Selesaikan latihan praktikum sesuai materi yang sudah dipelajari. Periksa kembali hasil pekerjaan dan pastikan seluruh instruksi tugas telah dibaca sebelum tenggat waktu.",
    className: "RPL 1",
    subjectName: "Pemrograman",
    teacherId: "seed-teacher-haidar",
    dueDate: "2026-10-22 06:00:00",
    reminderOffsetHours: 1,
    details: [
      { key: "Format", value: "PDF dan berkas sumber program" },
      { key: "Ketentuan", value: "Dikerjakan mandiri, kumpulkan sebelum pukul 06.00 WIB" },
    ],
  },
];

const PRIORITY_TASK_TITLE = "Pengumpulan Praktikum Pemrograman Dasar";

/* ------------------------------------------------------------------ */
/* Util                                                                 */
/* ------------------------------------------------------------------ */

const counters = {
  classesCreated: 0,
  classesReused: 0,
  subjectsCreated: 0,
  subjectsReused: 0,
  teachersCreated: 0,
  teachersUpdated: 0,
  studentsCreated: 0,
  studentsUpdated: 0,
  assignmentsCreated: 0,
  assignmentsReused: 0,
  tasksCreated: 0,
  tasksUpdated: 0,
  notificationsCreated: 0,
  notificationsReused: 0,
};

async function upsertUser({ id, name, email, role, classId }) {
  const { rows } = await ctx.query(
    `SELECT id FROM users WHERE id = $1 OR email = $2 LIMIT 1`,
    [id, email]
  );

  if (rows.length === 0) {
    await ctx.query(
      `INSERT INTO users (id, name, email, email_verified, role, class_id)
       VALUES ($1, $2, $3, TRUE, $4::user_role, $5)`,
      [id, name, email, role, classId ?? null]
    );
    return { userId: id, created: true };
  }

  const userId = rows[0].id;
  await ctx.query(
    `UPDATE users
     SET name = $1, role = $4::user_role, class_id = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND email = $3`,
    [name, userId, email, role, classId ?? null]
  );
  return { userId, created: false };
}

async function upsertCredentialAccount(userId, passwordHash) {
  const { rows } = await ctx.query(
    `SELECT id FROM accounts WHERE user_id = $1 AND provider_id = 'credential'`,
    [userId]
  );

  if (rows.length === 0) {
    // accountId pada akun credential harus sama dengan user id
    // (dipakai Better Auth saat findUserByEmail + pencocokan credential).
    await ctx.query(
      `INSERT INTO accounts (id, account_id, provider_id, user_id, password)
       VALUES ($1, $2, 'credential', $2, $3)`,
      [`seed-acc-${userId}`, userId, passwordHash]
    );
    return;
  }

  await ctx.query(
    `UPDATE accounts
     SET password = $2, account_id = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [rows[0].id, passwordHash, userId]
  );
}

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */

async function ensureClass(name) {
  const { rows } = await ctx.query(
    `SELECT id FROM classes WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (rows.length > 0) {
    counters.classesReused += 1;
    return rows[0].id;
  }
  const inserted = await ctx.query(
    `INSERT INTO classes (name) VALUES ($1) RETURNING id`,
    [name]
  );
  counters.classesCreated += 1;
  return inserted.rows[0].id;
}

async function ensureSubject({ name, code }) {
  const { rows } = await ctx.query(
    `SELECT id FROM subjects WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($2) LIMIT 1`,
    [name, code]
  );
  if (rows.length > 0) {
    counters.subjectsReused += 1;
    return rows[0].id;
  }
  const inserted = await ctx.query(
    `INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING id`,
    [name, code]
  );
  counters.subjectsCreated += 1;
  return inserted.rows[0].id;
}

async function ensureNotification(userId, taskId, kind, title, body) {
  const { rows } = await ctx.query(
    `SELECT id FROM notifications
     WHERE user_id = $1 AND task_id = $2 AND kind = $3
     LIMIT 1`,
    [userId, taskId, kind]
  );
  if (rows.length > 0) {
    counters.notificationsReused += 1;
    return;
  }
  await ctx.query(
    `INSERT INTO notifications (user_id, task_id, kind, title, body)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, taskId, kind, title, body]
  );
  counters.notificationsCreated += 1;
}

async function upsertTask(task, classId, subjectId) {
  const { rows } = await ctx.query(
    `SELECT id,
            to_char(due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date_text,
            reminder_offset_hours
     FROM tasks
     WHERE title = $1 AND class_id = $2
     LIMIT 1`,
    [task.title, classId]
  );

  const detailsJson = JSON.stringify(task.details ?? []);

  if (rows.length === 0) {
    const inserted = await ctx.query(
      `INSERT INTO tasks
         (teacher_id, class_id, title, description, due_date,
          reminder_offset_hours, subject_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING id`,
      [
        task.teacherId,
        classId,
        task.title,
        task.description,
        task.dueDate,
        task.reminderOffsetHours,
        subjectId,
        detailsJson,
      ]
    );
    counters.tasksCreated += 1;
    return inserted.rows[0].id;
  }

  const existing = rows[0];
  const scheduleChanged =
    existing.due_date_text.replace("T", " ") !== task.dueDate.replace("T", " ") ||
    existing.reminder_offset_hours !== task.reminderOffsetHours;

  // Samakan dengan perilaku PATCH /api/tasks/[id]: mengubah jadwal
  // menjadwalkan ulang pengingat email.
  if (scheduleChanged) {
    await ctx.query(
      `UPDATE tasks
       SET teacher_id = $1,
           description = $2,
           due_date = $3,
           reminder_offset_hours = $4,
           subject_id = $5,
           details = $6::jsonb,
           is_notified = FALSE,
           reminder_sent_at = NULL,
           notification_status = 'pending',
           notification_attempts = 0,
           last_notification_error = NULL
       WHERE id = $7`,
      [
        task.teacherId,
        task.description,
        task.dueDate,
        task.reminderOffsetHours,
        subjectId,
        detailsJson,
        existing.id,
      ]
    );
  } else {
    await ctx.query(
      `UPDATE tasks
       SET teacher_id = $1,
           description = $2,
           subject_id = $3,
           details = $4::jsonb
       WHERE id = $5`,
      [task.teacherId, task.description, subjectId, detailsJson, existing.id]
    );
  }
  counters.tasksUpdated += 1;
  return existing.id;
}

async function run() {
  console.log(
    DRY_RUN
      ? "MODE DRY-RUN (transaksi di-rollback, tanpa menulis). Tambahkan --yes untuk mengeksekusi.\n"
      : "MODE EKSEKUSI — menulis data pengujian ke database.\n"
  );

  const client = await pool.connect();
  ctx = client;

  try {
    await client.query("BEGIN");
    await seedAll();
    if (DRY_RUN) {
      await client.query("ROLLBACK");
      console.log("\nDry-run: semua perubahan di-rollback (tidak ada data yang tertulis).");
    } else {
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    ctx = pool;
    client.release();
  }
}

async function seedAll() {
  const passwordHash = await hashPassword(TEST_PASSWORD);

  // 1. Kelas
  const classIds = {};
  for (const name of CLASS_NAMES) {
    classIds[name] = await ensureClass(name);
  }

  // 2. Mata pelajaran
  const subjectIds = {};
  for (const subject of SUBJECTS) {
    subjectIds[subject.name] = await ensureSubject(subject);
  }

  // 3. Guru + akun credential
  for (const teacher of TEACHERS) {
    const { userId, created } = await upsertUser({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: "teacher",
      classId: null,
    });
    teacher.resolvedId = userId;
    if (created) counters.teachersCreated += 1;
    else counters.teachersUpdated += 1;
    await upsertCredentialAccount(userId, passwordHash);
  }

  // 4. Siswa + akun credential
  for (const student of STUDENTS) {
    const classId = classIds[student.className];
    const { userId, created } = await upsertUser({
      id: student.id,
      name: student.name,
      email: student.email,
      role: "student",
      classId,
    });
    student.resolvedId = userId;
    if (created) counters.studentsCreated += 1;
    else counters.studentsUpdated += 1;
    await upsertCredentialAccount(userId, passwordHash);
  }

  // 5. Penugasan mengajar
  for (const assignment of ASSIGNMENTS) {
    const classId = classIds[assignment.className];
    const subjectId = subjectIds[assignment.subjectName];
    const { rows } = await ctx.query(
      `SELECT id FROM teacher_assignments
       WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3`,
      [assignment.teacherId, classId, subjectId]
    );
    if (rows.length > 0) {
      counters.assignmentsReused += 1;
      continue;
    }
    await ctx.query(
      `INSERT INTO teacher_assignments (teacher_id, class_id, subject_id)
       VALUES ($1, $2, $3)`,
      [assignment.teacherId, classId, subjectId]
    );
    counters.assignmentsCreated += 1;
  }

  // 6. Tugas + notifikasi in-app
  for (const task of TASKS) {
    const classId = classIds[task.className];
    const subjectId = subjectIds[task.subjectName];
    const taskId = await upsertTask(task, classId, subjectId);

    const { rows: studentsInClass } = await ctx.query(
      `SELECT id, name FROM users WHERE class_id = $1 AND role = 'student'`,
      [classId]
    );
    const teacher = TEACHERS.find((t) => t.id === task.teacherId);
    for (const student of studentsInClass) {
      await ensureNotification(
        student.id,
        taskId,
        "task_published",
        `Tugas baru: ${task.title}`,
        `Diterbitkan oleh ${teacher ? teacher.name : "Guru"}`
      );
    }
  }

  // 7. Ringkasan
  console.log("Ringkasan seed:");
  console.log(`  Kelas            : ${counters.classesCreated} dibuat, ${counters.classesReused} dipakai ulang`);
  console.log(`  Mata pelajaran   : ${counters.subjectsCreated} dibuat, ${counters.subjectsReused} dipakai ulang`);
  console.log(`  Guru             : ${counters.teachersCreated} dibuat, ${counters.teachersUpdated} diperbarui`);
  console.log(`  Siswa            : ${counters.studentsCreated} dibuat, ${counters.studentsUpdated} diperbarui`);
  console.log(`  Penugasan mengajar: ${counters.assignmentsCreated} dibuat, ${counters.assignmentsReused} dipakai ulang`);
  console.log(`  Tugas            : ${counters.tasksCreated} dibuat, ${counters.tasksUpdated} diperbarui`);
  console.log(`  Notifikasi       : ${counters.notificationsCreated} dibuat, ${counters.notificationsReused} dipakai ulang`);

  // 8. Verifikasi
  const { rows: priority } = await ctx.query(
    `SELECT t.id, t.title,
            to_char(t.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date_text,
            t.reminder_offset_hours, t.is_notified,
            t.notification_status, c.name AS class_name, s.name AS subject_name,
            u.name AS teacher_name
     FROM tasks t
     JOIN classes c ON c.id = t.class_id
     LEFT JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN users u ON u.id = t.teacher_id
     WHERE t.title = $1`,
    [PRIORITY_TASK_TITLE]
  );

  if (priority.length > 0) {
    const p = priority[0];
    console.log("\nVerifikasi tugas prioritas:");
    console.log(`  id               : ${p.id}`);
    console.log(`  judul            : ${p.title}`);
    console.log(`  kelas            : ${p.class_name}`);
    console.log(`  mata pelajaran   : ${p.subject_name}`);
    console.log(`  guru             : ${p.teacher_name}`);
    console.log(`  due_date (stored): ${p.due_date_text} (wall-clock WIB)`);
    console.log(`  reminder offset  : ${p.reminder_offset_hours} jam sebelum tenggat`);
    console.log(`  is_notified      : ${p.is_notified}`);

    const { rows: recipients } = await ctx.query(
      `SELECT email FROM users WHERE class_id = (SELECT class_id FROM tasks WHERE id = $1) AND role = 'student' ORDER BY email`,
      [p.id]
    );
    const { rows: excluded } = await ctx.query(
      `SELECT email FROM users WHERE role = 'student' AND class_id <> (SELECT class_id FROM tasks WHERE id = $1) AND email LIKE '%@agendakita.test' ORDER BY email`,
      [p.id]
    );
    console.log(`  penerima email   : ${recipients.length} siswa kelas ${p.class_name}`);
    for (const r of recipients) console.log(`    + ${r.email}`);
    console.log(`  TIDAK menerima   : ${excluded.length} siswa kelas lain (filter cron berdasarkan class_id)`);
  } else {
    console.error("\nVERIFIKASI GAGAL: tugas prioritas tidak ditemukan.");
    process.exitCode = 1;
  }

  // 9. Kredensial — hanya file lokal, tidak dicetak ke log
  const credentialsPath = join(root, "scripts", ".seed-credentials.local.json");
  if (!DRY_RUN) {
    mkdirSync(dirname(credentialsPath), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      note: "Kredensial akun pengujian. Jangan commit file ini.",
      password: TEST_PASSWORD,
      accounts: [
        ...TEACHERS.map((t) => ({
          role: "teacher",
          name: t.name,
          email: t.email,
        })),
        ...STUDENTS.map((s) => ({
          role: "student",
          name: s.name,
          email: s.email,
          class: s.className,
        })),
      ],
    };
    writeFileSync(credentialsPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`\nKredensial akun pengujian ditulis ke: scripts/.seed-credentials.local.json`);
  } else {
    console.log(`\n(Dry-run) Kredensial akan ditulis ke: scripts/.seed-credentials.local.json`);
  }
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("Seed gagal:", error.message);
    await pool.end();
    process.exit(1);
  });
