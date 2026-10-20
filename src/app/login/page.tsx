"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layout/auth-layout";
import Button from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function GoogleIcon() {
  return (
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
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await signIn.email(
      { email, password, callbackURL: "/" },
      {
        onSuccess: async () => {
          try {
            const res = await fetch("/api/auth/get-session");
            const data = await res.json();
            const role = data?.user?.role;
            if (role === "admin") {
              router.push("/admin/dashboard");
            } else if (role === "teacher") {
              router.push("/teacher/dashboard");
            } else {
              router.push("/student/agenda");
            }
          } catch {
            router.push("/");
          }
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Email atau password salah.");
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    setError("");
    await signIn.social({
      provider: "google",
      callbackURL: "/auth/finish",
    });
  };

  return (
    <AuthLayout
      headline="Satu tempat untuk semua agenda tugas kelas."
      description="Guru menerbitkan tugas lengkap dengan tenggat dan pengingat. Siswa melihat agenda kelasnya, membuka detail, dan bertanya tanpa lewat pesan pribadi."
      points={[
        "Kalender tugas per kelas dengan penanda tenggat",
        "Pengingat email otomatis sebelum batas waktu",
        "Diskusi tugas yang tersimpan di tiap tugas",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-1.5 text-sm text-ink-3">
          Masuk untuk membuka agenda tugas kamu.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-3 transition-colors hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                {showPassword ? (
                  <path
                    d="M3 3l14 14M8.2 8.4a2.4 2.4 0 003.4 3.4M6.3 6.4C4.5 7.6 3.2 9.2 2.5 10c1.2 2 3.7 5 7.5 5 1.4 0 2.6-.4 3.7-1M15.9 13.3c1.2-1 2-2 2.6-3.3-1.2-2-3.7-5-7.5-5-.6 0-1.2.1-1.7.3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ) : (
                  <path
                    d="M2.5 10C3.7 8 6.2 5 10 5s6.3 3 7.5 5c-1.2 2-3.7 5-7.5 5s-6.3-3-7.5-5z M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </svg>
            </button>
          </div>
        </Field>

        <Button type="submit" variant="primary" className="h-11 w-full" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-rule" />
        <span className="text-xs text-ink-3">atau</span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-rule bg-surface text-sm font-medium text-ink transition-colors duration-[--dur-micro] hover:border-rule-strong hover:bg-surface-2"
      >
        <GoogleIcon />
        Lanjutkan dengan Google
      </button>

      <p className="mt-7 text-center text-sm text-ink-3">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-accent underline-offset-4 transition-colors hover:underline"
        >
          Daftar sebagai siswa
        </Link>
      </p>
    </AuthLayout>
  );
}
