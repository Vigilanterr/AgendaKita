"use client";

import { useEffect, useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layout/auth-layout";
import Button from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

interface ClassItem {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;

    fetch("/api/classes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat daftar kelas.");
        return res.json();
      })
      .then((data) => {
        if (active) setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setError("Gagal memuat daftar kelas. Coba muat ulang halaman.");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleRegister = async () => {
    setError("");
    await signIn.social({
      provider: "google",
      requestSignUp: true,
      callbackURL: "/auth/finish",
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!classId) {
      setError("Silakan pilih kelas terlebih dahulu.");
      setLoading(false);
      return;
    }

    await signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/student/agenda",
        // @ts-expect-error -- additional field non-bawaan yang didefinisikan di better-auth config
        class_id: Number(classId),
      },
      {
        onSuccess: () => {
          router.push("/student/agenda");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Pendaftaran gagal. Silakan coba lagi.");
          setLoading(false);
        },
      }
    );
  };

  return (
    <AuthLayout
      headline="Daftar sekali, agenda tugas langsung terbuka."
      description="Pilih kelas kamu, tentukan password, lalu semua tugas yang terbit untuk kelas tersebut muncul di kalender pribadi."
      points={[
        "Satu akun untuk akses agenda dan diskusi tugas",
        "Kelas dapat diubah oleh admin kapan saja",
        "Pengingat email aktif sesuai pengaturan guru",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Buat akun siswa
        </h1>
        <p className="mt-1.5 text-sm text-ink-3">
          Isi data berikut untuk membuka agenda kelas kamu.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Nama lengkap" htmlFor="name" required>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Nama lengkap kamu"
            className="h-11"
          />
        </Field>

        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="nama@sekolah.sch.id"
            className="h-11"
          />
        </Field>

        <Field label="Kelas" htmlFor="class" required>
          <Select
            id="class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            className="h-11"
          >
            <option value="">
              {classes.length === 0 ? "Memuat kelas..." : "-- Pilih kelas --"}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="Minimal 8 karakter."
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
            placeholder="Minimal 8 karakter"
            className="h-11"
          />
        </Field>

        <Button type="submit" variant="primary" className="h-11 w-full" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-rule" />
        <span className="text-xs text-ink-3">atau</span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-rule bg-surface text-sm font-medium text-ink transition-colors duration-[--dur-micro] hover:border-rule-strong hover:bg-surface-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Daftar dengan Google
      </button>

      <p className="mt-7 text-center text-sm text-ink-3">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-4 transition-colors hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
