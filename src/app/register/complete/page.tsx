"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardForRole } from "@/lib/roles";

interface ClassItem {
  id: number;
  name: string;
}

interface Status {
  class_id: number | null;
  has_password: boolean;
  role: string;
  needs_onboarding: boolean;
}

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/get-session");
        const sessionData = await sessionRes.json();

        if (!sessionData?.user) {
          router.replace("/login");
          return;
        }

        const [statusRes, classRes] = await Promise.all([
          fetch("/api/auth/profile-status"),
          fetch("/api/classes"),
        ]);

        if (!statusRes.ok) throw new Error("status");

        const statusData: Status = await statusRes.json();

        if (!statusData.needs_onboarding) {
          router.replace(dashboardForRole(statusData.role));
          return;
        }

        if (classRes.ok) {
          const classData = await classRes.json();
          if (active && Array.isArray(classData)) setClasses(classData);
        }

        if (active) {
          setStatus(statusData);
          if (statusData.class_id != null) setClassId(String(statusData.class_id));
        }
      } catch {
        if (active) setError("Gagal memuat data. Silakan muat ulang halaman.");
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const needClass = status?.class_id == null;
  const needPassword = status ? !status.has_password : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    setError("");

    if (needClass && !classId) {
      setError("Silakan pilih kelas terlebih dahulu.");
      return;
    }
    if (needPassword && password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (needPassword && password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(needClass ? { class_id: Number(classId) } : {}),
          ...(needPassword ? { password } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan data. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      router.push(data.redirect || dashboardForRole(status.role));
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper app-font text-ink">
      <div className="mx-auto flex w-full max-w-6xl px-4 pt-6 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
            A
          </span>
          AgendaKita
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Lengkapi akun kamu
            </h1>
            <p className="mt-1.5 text-sm text-ink-3">
              Satu langkah lagi supaya agenda kamu siap dipakai.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          {booting ? (
            <div className="space-y-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {needClass && (
                <Field label="Kelas" htmlFor="class" required>
                  <Select
                    id="class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    <option value="">
                      {classes.length === 0
                        ? "Memuat kelas..."
                        : "-- Pilih Kelas --"}
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {needPassword && (
                <>
                  <Field
                    label="Buat password"
                    htmlFor="password"
                    hint="Minimal 8 karakter. Dipakai juga untuk masuk tanpa Google."
                    required
                  >
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Ulangi password" htmlFor="confirm" required>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </Field>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan & lanjutkan"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
