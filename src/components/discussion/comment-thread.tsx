"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { formatDateTimeWIB } from "@/lib/format";

export type CommentItem = {
  id: number;
  task_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_role: string;
};

export default function CommentThread({
  taskId,
  currentUserId,
  canDelete,
}: {
  taskId: number;
  currentUserId: string;
  canDelete: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Gagal memuat diskusi. Coba muat ulang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetch(`/api/tasks/${taskId}/comments`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (active) setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setError("Gagal memuat diskusi. Coba muat ulang.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();

    if (!text) {
      setFieldError("Tulis pertanyaan atau jawaban kamu dulu.");
      return;
    }

    setFieldError("");
    setSending(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFieldError(data?.error || "Gagal mengirim pesan.");
        setSending(false);
        return;
      }

      setBody("");
      setSending(false);
      await load();
    } catch {
      setFieldError("Tidak dapat terhubung ke server.");
      setSending(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setComments(previous);
        setError("Gagal menghapus komentar.");
      }
    } catch {
      setComments(previous);
      setError("Tidak dapat terhubung ke server.");
    }
  };

  return (
    <section aria-labelledby="diskusi-heading" className="space-y-4">
      <h3 id="diskusi-heading" className="text-sm font-semibold text-ink">
        Diskusi
      </h3>

      {loading && (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-md bg-surface-2" />
          <div className="h-12 animate-pulse rounded-md bg-surface-2" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="rounded-md border border-dashed border-rule px-3 py-6 text-center text-sm text-ink-3">
          Belum ada pertanyaan. Jadilah yang pertama bertanya.
        </p>
      )}

      {!loading && comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = comment.user_id === currentUserId;
            return (
              <li
                key={comment.id}
                className="rounded-md border border-rule bg-surface-2/50 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {comment.author_name}
                      <span className="ml-2 text-xs font-normal text-ink-3">
                        {comment.author_role === "teacher"
                          ? "Guru"
                          : comment.author_role === "admin"
                            ? "Admin"
                            : "Siswa"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      {formatDateTimeWIB(comment.created_at)}
                    </p>
                  </div>
                  {canDelete && isAuthor && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="shrink-0 text-xs text-ink-3 underline-offset-2 transition-colors hover:text-danger hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
                  {comment.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Tulis pertanyaan atau jawaban di sini..."
          aria-label="Tulis pesan"
          invalid={Boolean(fieldError)}
        />
        {fieldError && <p className="text-xs text-danger">{fieldError}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" disabled={sending}>
            {sending ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
      </form>
    </section>
  );
}
