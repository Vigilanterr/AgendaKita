
import Image from "next/image";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <nav
        className="landing-container nav-inner"
        aria-label="Navigasi utama"
      >

<Link href="/" className="brand">
  <span className="flex h-14 w-14 shrink-0 items-center justify-center">
    <Image
      src="/images/logo.png"
      alt="Logo AgendaKita"
      width={56}
      height={56}
      priority
      className="h-full w-full object-contain"
    />
  </span>

          <span>
            Agenda<span className="brand-accent">Kita</span>
          </span>
        </Link>

        <div className="nav-links">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#peran">Untuk Siapa</a>
        </div>

        <div className="nav-actions">
          <Link href="/login" className="button button-quiet">
            Masuk
          </Link>

          <Link
            href="/register"
            className="button button-primary nav-register"
          >
            Daftar Gratis <span>↗</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
