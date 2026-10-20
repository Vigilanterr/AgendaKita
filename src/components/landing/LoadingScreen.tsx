"use client";
import { useEffect, useState } from "react";
import { CalendarIcon } from "./Icons";
export function LoadingScreen() {
 const [visible, setVisible] = useState(true);
 useEffect(() => {
  const started = Date.now();
  const finish = () => window.setTimeout(() => setVisible(false), Math.max(0, 850 - (Date.now() - started)));
  if (document.readyState === "complete") finish();
  else { window.addEventListener("load", finish, { once: true }); }
  const fallback = window.setTimeout(() => setVisible(false), 1800);
  return () => { window.removeEventListener("load", finish); window.clearTimeout(fallback); };
 }, []);
 if (!visible) return null;
 return <div className="loading-screen" role="status" aria-label="Memuat AgendaSekolah"><div className="loader-brand"><span className="loader-logo"><CalendarIcon width={28} height={28}/></span><span>Agenda<span>Sekolah</span></span></div><div className="loader-track"><span/></div><p>Menyiapkan agenda belajarmu...</p></div>;
}
