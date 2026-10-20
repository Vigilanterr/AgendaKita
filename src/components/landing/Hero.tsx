import Link from "next/link";
import { ArrowIcon, BellIcon, CalendarIcon, CheckIcon, ChatIcon } from "./Icons";

const tasks = [
  { title: "Latihan Basis Data", subject: "Produktif RPL · 09.00", tag: "Besok", tone: "blue" },
  { title: "Ringkasan Bahasa Indonesia", subject: "Bahasa Indonesia · 23.59", tag: "3 hari lagi", tone: "cyan" },
  { title: "Laporan Praktikum IPA", subject: "Ilmu Pengetahuan Alam", tag: "Jumat", tone: "violet" },
];
export function LandingHero() {
 return <section className="hero-section"><div className="landing-container hero-grid">
  <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> Platform manajemen tugas sekolah</div>
   <h1>Jangan lewatkan <span>tenggat tugas</span> lagi.</h1>
   <p className="hero-description">Semua agenda akademik dalam satu tempat. Kelola tugas, pantau deadline, dan dapatkan pengingat sebelum waktunya habis.</p>
   <div className="hero-actions"><Link href="/register" className="button button-primary button-large">Mulai Sekarang <ArrowIcon width={17} height={17}/></Link><a href="#fitur" className="button button-outline button-large">Jelajahi Fitur</a></div>
   <div className="hero-points"><span><CheckIcon/> Agenda sesuai kelas</span><span><CheckIcon/> Pengingat lewat email</span></div>
  </div>
  <div className="dashboard-scene" aria-label="Ilustrasi preview dashboard agenda"><div className="scene-glow"/><div className="dashboard-window">
   <div className="window-top"><div className="window-dots"><i/><i/><i/></div><span>AgendaSekolah</span><span className="avatar">A</span></div>
   <div className="dashboard-body"><aside className="mini-sidebar"><div className="side-active"><CalendarIcon/> Beranda</div><div><span>▤</span> Tugas</div><div><span>▦</span> Kalender</div><div><ChatIcon/> Diskusi</div></aside>
    <div className="task-panel"><div className="task-panel-heading"><div><small>RINGKASAN AGENDA</small><h2>Tugas kamu</h2></div><span className="date-chip">Minggu ini⌄</span></div>
     <div className="mini-stats"><div><small>Belum selesai</small><strong>04</strong></div><div><small>Mendekati deadline</small><strong className="stat-blue">02</strong></div><div><small>Selesai</small><strong>08</strong></div></div>
     <p className="list-label">Tugas mendatang</p>{tasks.map((task) => <div className="preview-task" key={task.title}><span className={`task-icon ${task.tone}`}><CalendarIcon/></span><div className="task-info"><strong>{task.title}</strong><small>{task.subject}</small></div><span className={`task-tag ${task.tone}`}>{task.tag}</span></div>)}
     <div className="reminder-note"><span><BellIcon/></span><div><strong>Pengingat aktif</strong><small>Kami bantu kamu tetap on track.</small></div><span className="toggle-on"/></div>
    </div>
   </div>
  </div><div className="floating-note note-calendar"><span><CalendarIcon/></span><div><strong>Agenda teratur</strong><small>Semua tugas terpantau</small></div></div><div className="floating-note note-chat"><span><ChatIcon/></span><div><strong>Diskusi terarah</strong><small>Tanya langsung di tugas</small></div></div></div>
 </div></section>;
}
