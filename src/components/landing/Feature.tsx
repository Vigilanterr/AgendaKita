import { BellIcon, CalendarIcon, ChatIcon, ShieldIcon } from "./Icons";
const features = [
 { icon: CalendarIcon, title: "Agenda terpusat", text: "Lihat tugas berdasarkan tanggal dan kelas tanpa perlu mencari dari banyak tempat.", color: "blue" },
 { icon: BellIcon, title: "Pengingat otomatis", text: "Dapatkan email pengingat sesuai jadwal yang ditentukan untuk setiap tugas.", color: "sky" },
 { icon: ChatIcon, title: "Diskusi per tugas", text: "Tanyakan instruksi dan balas komentar di ruang diskusi khusus setiap tugas.", color: "indigo" },
 { icon: ShieldIcon, title: "Akses sesuai peran", text: "Ruang siswa, guru, dan admin dipisahkan agar fitur dan data tetap terjaga.", color: "blue" },
];
export function FeatureSection() { return <section className="section section-soft" id="fitur"><div className="landing-container"><div className="section-heading centered"><span className="section-kicker">Fitur utama</span><h2>Semua yang kamu butuhkan,<br/><span>dalam satu platform.</span></h2><p>Dibuat untuk membuat pengelolaan tugas terasa lebih sederhana bagi siswa dan guru.</p></div><div className="feature-grid">{features.map(({icon: Icon,title,text,color})=><article className="feature-card" key={title}><div className={`feature-icon ${color}`}><Icon width={25} height={25}/></div><h3>{title}</h3><p>{text}</p><span className="feature-arrow">↗</span></article>)}</div></div></section>; }
