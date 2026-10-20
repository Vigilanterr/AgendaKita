export type ReminderTask = {
  id: number;
  title: string;
  description: string | null;
  /** "YYYY-MM-DDTHH:mm" atau "YYYY-MM-DD HH:mm:ss" — wall-clock WIB (UTC+7). */
  due_date: string;
  class_id: number;
  class_name: string;
  teacher_name: string | null;
  subject_name: string | null;
};

const WIB_OFFSET = "+07:00";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mengubah timestamp wall-clock WIB menjadi Date instan.
 * WIB (Asia/Jakarta) tidak memiliki daylight saving, offset +07:00 selalu valid.
 */
export function parseWibDueDate(dueWib: string): Date {
  const normalized = dueWib.includes("T") ? dueWib : dueWib.replace(" ", "T");
  return new Date(`${normalized.slice(0, 16)}:00${WIB_OFFSET}`);
}

export function formatDeadlineWib(dueWib: string): string {
  return parseWibDueDate(dueWib).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function formatDeadlineTimeWib(dueWib: string): string {
  return parseWibDueDate(dueWib).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatRemaining(dueWib: string, now: Date = new Date()): string {
  const diffMs = parseWibDueDate(dueWib).getTime() - now.getTime();
  if (diffMs <= 0) return "tenggat telah lewat";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
}

export function buildReminderSubject(task: ReminderTask): string {
  return `Pengingat Deadline: ${task.title} — ${formatDeadlineTimeWib(task.due_date)} WIB`;
}

export function buildReminderHtml(
  task: ReminderTask,
  appUrl: string,
  now: Date = new Date()
): string {
  const dueDate = formatDeadlineWib(task.due_date);
  const remaining = formatRemaining(task.due_date, now);
  const teacherName = task.teacher_name ?? "-";
  const subjectName = task.subject_name ?? "-";
  const title = escapeHtml(task.title);
  const className = escapeHtml(task.class_name);
  const teacher = escapeHtml(teacherName);
  const subject = escapeHtml(subjectName);
  const description = task.description ? escapeHtml(task.description) : "";
  const agendaUrl = `${appUrl.replace(/\/$/, "")}/student/agenda`;

  return `<!DOCTYPE html>
<html lang="id">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0f172a;padding:24px 32px;">
                <p style="margin:0;font-size:14px;font-weight:bold;letter-spacing:0.08em;color:#ffffff;text-transform:uppercase;">AgendaKita</p>
                <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Pengingat Tugas Sekolah</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#0f172a;">Tugas Mendekati Tenggat Waktu</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                  Halo, tugas berikut untuk kelas <strong>${className}</strong> akan segera jatuh tempo. Mohon segera diselesaikan.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Tugas</p>
                      <p style="margin:0;font-size:15px;font-weight:bold;color:#0f172a;">${title}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Guru</p>
                      <p style="margin:0;font-size:14px;color:#0f172a;">${teacher}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Kelas &amp; Mata Pelajaran</p>
                      <p style="margin:0;font-size:14px;color:#0f172a;">${className} · ${subject}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Batas Waktu</p>
                      <p style="margin:0;font-size:14px;font-weight:bold;color:#b45309;">${dueDate} WIB</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Sisa Waktu</p>
                      <p style="margin:0;font-size:14px;color:#0f172a;">${remaining}</p>
                    </td>
                  </tr>
                </table>

                ${
                  description
                    ? `<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#64748b;"><strong>Instruksi:</strong> ${description}</p>`
                    : ""
                }

                <a href="${escapeHtml(agendaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#0f172a;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;">
                  Buka Agenda Saya
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  Email ini dikirim otomatis oleh sistem AgendaKita. Mohon jangan balas email ini.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
