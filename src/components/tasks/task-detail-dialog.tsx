"use client";

import Dialog from "@/components/ui/dialog";
import Badge from "@/components/ui/badge";
import CommentThread from "@/components/discussion/comment-thread";
import {
  formatDateTimeWIB,
  formatRelative,
  isOverdue,
  reminderLabel,
} from "@/lib/format";

export type TaskDetailItem = {
  key: string;
  value: string;
};

export type TaskDetailData = {
  id: number;
  title: string;
  description: string | null;
  class_id: number;
  teacher_id: string | null;
  subject_id: number | null;
  details: TaskDetailItem[];
  due_date: string;
  reminder_offset_hours: number;
  is_notified: boolean;
  reminder_sent_at: string | null;
  created_at: string;
  class_name: string;
  teacher_name: string;
  subject_name: string | null;
  subject_code: string | null;
};

export default function TaskDetailDialog({
  task,
  currentUserId,
  onClose,
}: {
  task: TaskDetailData | null;
  currentUserId: string;
  onClose: () => void;
}) {
  if (!task) return null;

  const overdue = isOverdue(task.due_date);
  const details = Array.isArray(task.details) ? task.details : [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={task.title}
      description={`${task.class_name}${task.subject_name ? ` · ${task.subject_name}` : ""}`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={overdue ? "danger" : "accent"}>
            {overdue ? "Lewat tenggat" : "Aktif"}
          </Badge>
          <Badge tone={task.is_notified ? "info" : "neutral"}>
            {task.is_notified ? "Pengingat terkirim" : "Pengingat terjadwal"}
          </Badge>
          {task.subject_code && <Badge tone="neutral">{task.subject_code}</Badge>}
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-y border-rule py-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Guru pengajar
            </dt>
            <dd className="mt-0.5 text-sm text-ink">{task.teacher_name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Kelas
            </dt>
            <dd className="mt-0.5 text-sm text-ink">
              {task.class_name}
              {task.subject_name ? ` · ${task.subject_name}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Tenggat
            </dt>
            <dd className="mt-0.5 text-sm text-ink">
              {formatDateTimeWIB(task.due_date)} WIB
              <span className="ml-1.5 text-xs text-ink-3">
                ({formatRelative(task.due_date)})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Pengingat
            </dt>
            <dd className="mt-0.5 text-sm text-ink">
              {reminderLabel(task.reminder_offset_hours)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Diterbitkan
            </dt>
            <dd className="mt-0.5 text-sm text-ink">
              {formatDateTimeWIB(task.created_at)}
            </dd>
          </div>
        </dl>

        {task.description && (
          <section>
            <h3 className="text-sm font-semibold text-ink">Deskripsi</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
              {task.description}
            </p>
          </section>
        )}

        {details.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-ink">Ketentuan pengerjaan</h3>
            <dl className="mt-2 divide-y divide-rule overflow-hidden rounded-md border border-rule">
              {details.map((detail) => (
                <div
                  key={detail.key}
                  className="flex flex-col gap-0.5 bg-surface px-3.5 py-2.5 sm:flex-row sm:gap-4"
                >
                  <dt className="text-xs font-medium text-ink-3 sm:w-44 sm:shrink-0">
                    {detail.key}
                  </dt>
                  <dd className="text-sm text-ink-2">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <CommentThread
          taskId={task.id}
          currentUserId={currentUserId}
          canDelete
        />
      </div>
    </Dialog>
  );
}
