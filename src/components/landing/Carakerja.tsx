import Link from "next/link";
import { ArrowIcon, CheckIcon } from "./Icons";
const steps = [
 {number:"01",title:"Daftar atau masuk",text:"Gunakan email, Google, atau GitHub untuk mengakses akun."},
 {number:"02",title:"Lengkapi profil",text:"Pilih kelas agar agenda yang tampil sesuai kebutuhanmu."},
 {number:"03",title:"Mulai lebih teratur",text:"Pantau tugas, diskusikan instruksi, dan ikuti pengingat deadline."},
];
export function HowItWorks() { return <section className="section" id="cara-kerja"><div className="landing-container how-grid"><div className="how-copy"><span className="section-kicker">Cara kerja</span><h2>Mulai lebih teratur<br/>dalam tiga langkah.</h2><p>Tanpa alur yang rumit. Masuk ke platform, lihat agenda kelasmu, dan fokus menyelesaikan tugas satu per satu.</p><Link href="/register" className="text-link">Buat akun gratis <ArrowIcon width={17} height={17}/></Link></div><div className="steps-list">{steps.map((step)=><article className="step-item" key={step.number}><div className="step-number">{step.number}</div><div><h3>{step.title}</h3><p>{step.text}</p></div><CheckIcon className="step-check" width={19} height={19}/></article>)}</div></div></section>; }

