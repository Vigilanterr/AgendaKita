import Link from "next/link";
import { ArrowIcon, BellIcon, CalendarIcon, CheckIcon, ShieldIcon } from "./Icons";
const roles = [
 {name:"Siswa",label:"Belajar lebih terarah",icon:CalendarIcon,tone:"role-blue",items:["Lihat agenda sesuai kelas","Baca instruksi tugas","Diskusi dengan guru"]},
 {name:"Guru",label:"Kelola tugas dengan mudah",icon:BellIcon,tone:"role-sky",items:["Buat tugas dan deadline","Atur pengingat email","Pantau diskusi tugas"]},
 {name:"Admin",label:"Kelola akses platform",icon:ShieldIcon,tone:"role-indigo",items:["Kelola kelas dan pengguna","Pantau akses sistem","Jaga data tetap teratur"]},
];
export function RolesSection() { return <section className="section section-soft" id="peran"><div className="landing-container"><div className="section-heading"><span className="section-kicker">Dibuat untuk semua peran</span><h2>Satu platform, kebutuhan<br/><span>yang saling terhubung.</span></h2><p>Setiap pengguna mendapatkan ruang dan fitur yang sesuai dengan tanggung jawabnya.</p></div><div className="roles-grid">{roles.map(({name,label,icon:Icon,tone,items})=><article className={`role-card ${tone}`} key={name}><div className="role-top"><span className="role-icon"><Icon width={25} height={25}/></span><span className="role-label">{label}</span></div><h3>{name}</h3><ul>{items.map(item=><li key={item}><CheckIcon width={16} height={16}/>{item}</li>)}</ul><Link href="/login" className="role-link">Masuk sebagai {name.toLowerCase()} <ArrowIcon width={16} height={16}/></Link></article>)}</div></div></section>; }
