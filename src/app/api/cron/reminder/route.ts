import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logServerError } from "@/lib/logger";
import {
  buildReminderHtml,
  buildReminderSubject,
  type ReminderTask,
} from "@/lib/reminder-email";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const urlSecret = new URL(req.url).searchParams.get("secret");

  if (!secret || (authHeader !== `Bearer ${secret}` && urlSecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json(
      { error: "Konfigurasi SMTP belum lengkap" },
      { status: 500 }
    );
  }

  try {
    const { rows: pendingTasks } = await query<ReminderTask>(
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
       WHERE t.is_notified = FALSE
         AND t.due_date - make_interval(hours => t.reminder_offset_hours) <= (NOW() AT TIME ZONE 'Asia/Jakarta')
         AND t.due_date > (NOW() AT TIME ZONE 'Asia/Jakarta')
       ORDER BY t.due_date ASC`
    );

    if (pendingTasks.length === 0) {
      return NextResponse.json({ message: "Tidak ada email yang perlu dikirim." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    let sent = 0;
    let failed = 0;

    for (const task of pendingTasks) {
      await query(
        `UPDATE tasks
         SET notification_attempts = notification_attempts + 1,
             notification_started_at = NOW(),
             notification_status = 'sending'
         WHERE id = $1`,
        [task.id]
      );

      const { rows: students } = await query<{ email: string }>(
        `SELECT email FROM users WHERE class_id = $1 AND role = 'student'`,
        [task.class_id]
      );

      if (students.length === 0) {
        await query(
          `UPDATE tasks
           SET is_notified = TRUE,
               notification_status = 'sent',
               reminder_sent_at = NOW(),
               last_notification_error = NULL
           WHERE id = $1`,
          [task.id]
        );
        continue;
      }

      try {
        await transporter.sendMail({
          from: `"AgendaKita" <${process.env.EMAIL_USER}>`,
          bcc: students.map((s) => s.email),
          subject: buildReminderSubject(task),
          html: buildReminderHtml(task, appUrl),
        });

        await query(
          `UPDATE tasks
           SET is_notified = TRUE,
               notification_status = 'sent',
               reminder_sent_at = NOW(),
               last_notification_error = NULL
           WHERE id = $1`,
          [task.id]
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : "Kesalahan SMTP tidak diketahui";
        logServerError(`cron/reminder task=${task.id}`, error);
        await query(
          `UPDATE tasks
           SET notification_status = 'failed',
               last_notification_error = $2
           WHERE id = $1`,
          [task.id, message.slice(0, 500)]
        );
      }
    }

    return NextResponse.json({
      success: failed === 0,
      processed: pendingTasks.length,
      sent,
      failed,
    });
  } catch (error) {
    logServerError("api/cron/reminder", error);
    return NextResponse.json({ error: "Gagal memproses cron" }, { status: 500 });
  }
}
