import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgendaKita — Manajemen Tugas & Agenda Sekolah",
  description:
    "Platform manajemen tugas dan agenda sekolah untuk siswa dan guru. Pengingat email otomatis sebelum tenggat waktu dalam satu tempat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-white">{children}</body>
    </html>
  );
}
