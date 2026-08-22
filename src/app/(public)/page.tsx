/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight, Clock3, MapPin, Star } from 'lucide-react'

const images = {
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1jej_x8XHso_gtUeIQlrqaOZXwVfiZHGI-92ZNqxYo35BtpzcEje0SLgNaSnj00AbkYvB86OrQbS99Cg96IL-YJExPizHGWqeCkYZbfEnPlMcSe1WQLrtlm_RIzhCLSxNTqFFKERQhoSsK2XHXl6YrE-MgWJjEpk8gwgl_FVx3DLwX8-oN1acgUkTN7bv1tgWBhU85iGNHu_mtXk-oSc2-eyF2rJ1K1YmcUoqhuMZg8m4SYJ5yQeF7A',
  aligners: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkO4n7rW87YdUdQr21cEbJB78Q32c4pOLRNQdv5yn_3FiHDw3MtZWtkJ64Wg3mHYuBiICiIkWkBnXds6KTykm4gfF75urzaEXqVqu2OEHSeTn6L0P-IHsAdXOZBB_JxVCPm7Ao1iaKa1TzZEa9HPnuVKiWI7E2WapmXKjlhZPHJ828cjv9Ar1N5iIlLkZWvGgtS44oSvUtAUwXURkCLD9g8aDsNq-wMobBkkn87cE6yocFLCGILB_RTA',
  smile: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdoCjSkoBEkFBsVJif5ZQjnLNffhQgmPc51fj5EQF-XGr6QBsVHTMXUTOFHT2oasGzleIaEu6_fe3S14mEQ3jsuUIgxNYocn_sqcDqoT_HQseZEoFXv8jDKJKU88oZv-E-fHeKQLgthYDqNRS2WCxg7bRvnt5jE8B4D0j0twI19CymS6lUOnVK20g_Lc0YNFWT_vAC5LO3m5B5BAhXb0p4m8NY5pC79bkM9t-UlgNR08srmKJj9qGssg',
  implant: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLvw_O2WOT9nEpRdt5cj4vzu_Uu6lAdPGgisOm0z1fqi3RuZma390MMXzXv4FMz-n3s6lpNWSALBiHJQwppkCefWSg8UyFjCBAOONXsovIiquWo_Ew5TzgN_BZqnLcuMC7T0TA9sZTQnbKhSTiZ4FTXH_bYUIeJfQac96BUKqjpp1ZyDoOSRu6T3svcIyTOdRG5LFWPAGVREi139dNGELTs6QZL_04ogYxqEumhWLNrtaBkElWA0EX6g',
  radiography: '/studies/dental-radiography.jpg',
  radiography2d: '/studies/dental-xray-film.jpg',
  specialists: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBXvcC4qh_fjzlwnlgCtn1nz6ck2wG3YwVpzKvpMovJ-5oFex-TFLLg21kVORxKcaOedaQpz3T1bC4eJXYMCUG7BSLEwKzlyPADkATiG4Wx-rPg08hY84LKS7F6uN3Ex1F8RFvUrtOdzDyfJI6X3lrCdxQTr7byk-ix4zzfY373gCKGH5zLK41FsUoHwB2pOYrymtJ5_ANnZz4ewRKCCN4zo75RzVFWkNh5dJ71n8I4PMsnF-Qg80tTsQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAhcex3ZZGZFQnJbNdLcsZg3oz-vUQdWmNbdHu-9cUJsqdy2lt1K_iA1OXQYDgvSQVqnGrAPf1qaqy7-6KXM9Rqa6LlksBTplRmWo0nm_uOBnGD6Czl3xZH7Y4QSLNhQZY3NpGJylNAyqsAdrmmlAXpHZQpNGGGFr_R09YJo8Ptw47Y25QVyThTOIne83nRkFDlrnw9gupicAnvRj_Hf_MKaqE9i1flnXXoTNPmR4BmaPu5K0ZD6NdpGQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBHCr0DSYoWuH7U15FYGK4W6GRlotGOtJMx5SRZngIdAuxZExXys2fOfs50JB6JaB0gLe-uVv7B2dLto2CaU1DniOYxFSNVmeuucd9gOTYpTx7kjisD8wT7eiqoEkmDGjPO9ewx8xE5l4wcKaCENV07C4hECdKjLiLXfNrkdoCKpkaEtTyTIoP7TmwG03d-saikQIh3lhfJ6jKNWeC_c6zO7e_1G5W8xRV5e05JI8zLIj7TencMS4dKeg',
  ],
  map: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz41bnwikViLsQNhwHk0iAq5ALN7XGvVVpbnsPXS4Kcj28EQLel-4oXg39JovlZMqoAbRYcw_suBypGNoO32j7GtXENNva6HN-QoeRfMEStDvveEepWAWuiVPfdIGki-zKovIUcP64iOjrHXtyv8JxuTcPRuXwAxYJeKdCllNRg1xqqCvQKyfLpslFGRM-Xgwavcgz191RBNa9GWjV24Se0nwfNGdtIBf-pKWJqkChSnZiuN11Zi4CdA',
}

const specialists = [
  ['Implantología', 'Dra. Elena Santos', 'CEDULA: 8493021', 'Especialista en cirugía oral e implantología avanzada. Pionera en técnicas de regeneración ósea mínimamente invasivas, ofreciendo resultados precisos y naturales.'],
  ['Ortodoncia', 'Dr. Alejandro Vega', 'CEDULA: 5729103', 'Experto en ortodoncia invisible y diseño de sonrisa digital. Su enfoque se centra en la armonía facial y la funcionalidad a largo plazo mediante tecnología 3D.'],
  ['Estética Dental', 'Dra. Lucía Navarro', 'CEDULA: 9384712', 'Dedicada a transformar sonrisas con carillas de porcelana ultradelgadas y blanqueamiento clínico. Combina arte y ciencia para lograr una estética dental impecable.'],
]

const reviews = [
  ['Hace 1 semana', '“Una experiencia completamente diferente a cualquier otro dentista. El trato es impecable, el espacio transmite mucha paz y los resultados de mi blanqueamiento superaron mis expectativas. Totalmente recomendado.”', 'Ana G.', 'Estética Dental'],
  ['Hace 1 mes', '“El nivel de especialización es altísimo. Me realizaron un tratamiento de ortodoncia invisible y todo el proceso fue transparente, sin dolor y con tecnología de punta. Las instalaciones de Vitae Sur son de primer nivel.”', 'Carlos M.', 'Ortodoncia Especializada'],
  ['Hace 2 meses', '“Siempre me dio ansiedad ir al dentista, pero en Vitae Centro me hicieron sentir súper relajada. Desde el aroma al entrar hasta la atención de los especialistas, todo está pensado para tu bienestar.”', 'Laura R.', 'Cuidado Preventivo'],
]

const clinics = [
  ['Vitae Centro', 'Av. Principal 123, Col. Centro, CDMX', 'Lunes a Viernes: 9:00 - 20:00', 'Sábado: 9:00 - 14:00', '+52 (55) 1234-5678'],
  ['Vitae Norte', 'Circuito Satélite 45, Naucalpan, Edo. Méx.', 'Lunes a Viernes: 10:00 - 19:00', 'Sábado: 10:00 - 15:00', '+52 (55) 8765-4321'],
  ['Vitae Sur', 'Av. Insurgentes Sur 1580, San Ángel, CDMX', 'Lunes a Viernes: 9:00 - 21:00', 'Sábado: 9:00 - 16:00', '+52 (55) 5555-5555'],
]

function Cta({ children = 'Book Appointment' }: { children?: React.ReactNode }) {
  return <Link href="/appointments" className="vitae-primary">{children}</Link>
}

export default function HomePage() {
  return <main className="vitae-landing">
    <section className="vitae-hero">
      <img src={images.hero} alt="A serene, high-key Vitae dental clinic" className="vitae-hero-image" />
      <div className="vitae-hero-scrim" />
      <div className="vitae-container vitae-hero-copy">
        <span className="vitae-rating"><Star size={16} fill="currentColor" />4.9 on Google</span>
        <h1>Tu sonrisa merece una atención excepcional.</h1>
        <p>Combining advanced clinical technology with an elevated, serene environment designed for your comfort and wellness.</p>
        <div className="vitae-actions"><Cta /><a href="#servicios" className="vitae-secondary">Explore Services</a></div>
      </div>
    </section>

    <section id="servicios" className="vitae-section vitae-container">
      <header className="vitae-centered"><h2>Excelencia en cada tratamiento</h2><p>Descubra nuestro catálogo de servicios dentales de primera clase, diseñados para ofrecer resultados estéticos y funcionales superiores en un entorno sereno y profesional.</p></header>
      <div className="vitae-service-grid">
        <article className="vitae-service vitae-wide"><img src={images.aligners} alt="Clear orthodontic aligners" /><div><span>Ortodoncia Invisible</span><h3>Alineación Precisa</h3><p>Corrección dental discreta y efectiva utilizando tecnología 3D avanzada. Resultados predecibles sin comprometer su estética durante el proceso.</p><a href="/appointments">Conocer más <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service"><img src={images.smile} alt="A natural white smile" /><div><span>Estética</span><h3>Carillas de Porcelana</h3><p>Restauraciones ultrafinas diseñadas artesanalmente para perfeccionar la forma, color y simetría de su sonrisa.</p><a href="/appointments">Conocer más <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service vitae-copy-service"><div><span>Odontología General</span><h3>Prevención Integral</h3><p>Mantenimiento preventivo, limpiezas profundas y revisiones exhaustivas para asegurar la salud a largo plazo de su ecosistema oral.</p><a href="/appointments">Conocer más <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service vitae-wide vitae-reverse"><img src={images.implant} alt="Dental implant procedure instruments" /><div><span>Implantología</span><h3>Restauración Estructural</h3><p>Reemplazo de piezas dentales perdidas mediante implantes de titanio biocompatible de última generación, restaurando función y confianza.</p><a href="/appointments">Conocer más <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service"><img src={images.radiography} alt="Radiografía dental panorámica" /><div><span>Estudios</span><h3>Radiografía Dental</h3><p>Imágenes diagnósticas para evaluar piezas dentales, raíces y estructuras de soporte con claridad.</p><a href="/appointments">Solicitar estudio <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service"><img src={images.radiography2d} alt="Película de radiografía dental 2D" /><div><span>Estudios</span><h3>Radiografía 2D</h3><p>Estudios panorámicos y laterales para apoyar la valoración clínica y la planificación del tratamiento.</p><a href="/appointments">Solicitar estudio <ArrowRight size={16} /></a></div></article>
        <article className="vitae-service vitae-copy-service"><div><span>Estudios</span><h3>Escaneo Intraoral</h3><p>Registro digital en formato STL para ortodoncia, restauraciones y modelos sin impresiones convencionales.</p><a href="/appointments">Solicitar estudio <ArrowRight size={16} /></a></div></article>
      </div>
    </section>

    <div className="vitae-dark-cta vitae-container">
      <h2>¿Necesitas solicitar un estudio para tu paciente?</h2>
      <p>Si eres médico o profesional de la salud, crea una orden de estudio y comparte los datos necesarios para su atención.</p>
      <Link href="/appointments?tipo=doctor" className="vitae-primary">Solicitar estudio</Link>
    </div>

    <section id="especialistas" className="vitae-section vitae-container">
      <header className="vitae-centered"><h2>Liderando la innovación dental</h2><p>Conoce a nuestro equipo de especialistas altamente cualificados, dedicados a brindar una atención excepcional y personalizada en un entorno de vanguardia.</p></header>
      <div className="vitae-specialists">{specialists.map(([type, name, license, description], index) => <article key={name} className="vitae-specialist"><img src={images.specialists[index]} alt={`Portrait of ${name}`} /><div><span>{type}</span><h3>{name}</h3><small>{license}</small><p>{description}</p><Cta>Agendar Cita</Cta></div></article>)}</div>
    </section>

    <section id="reviews" className="vitae-section vitae-container">
      <header className="vitae-centered"><h2>Confianza en cada sonrisa</h2><p>Descubre por qué cientos de pacientes eligen Vitae para su cuidado dental y bienestar estético. Experiencia de lujo, resultados excepcionales.</p><div className="vitae-google"><b>Google</b><span>{[1,2,3,4,5].map((i) => <Star key={i} size={18} fill="currentColor" />)}</span><strong>4.9/5</strong> (240+ reseñas)</div></header>
      <div className="vitae-reviews">{reviews.map(([when, quote, name, service]) => <article key={name}><div><span className="vitae-stars">★★★★★</span><small>{when}</small></div><blockquote>{quote}</blockquote><p><b>{name}</b><br /><small>{service}</small></p></article>)}</div>
    </section>

    <section id="ubicaciones" className="vitae-locations"><div className="vitae-container"><header><h2>Nuestras Sedes</h2><p>Encuentra la clínica Vitae más cercana a ti. Diseñadas como santuarios de bienestar para tu salud dental.</p></header><div className="vitae-locations-grid"><div className="vitae-clinics">{clinics.map(([name, address, weekday, saturday, phone], index) => <article key={name}>{index === 2 && <em>Nuevo</em>}<h3>{name}</h3><p><MapPin size={18}/>{address}</p><small><Clock3 size={17}/>{weekday}<br />{saturday}<br />{phone}</small><div><Cta>Agendar Cita</Cta><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>Cómo llegar</a></div></article>)}</div><div className="vitae-map"><img src={images.map} alt="Map of Mexico City clinic locations" /><i className="pin-one"><MapPin fill="currentColor" /></i><i className="pin-two"><MapPin fill="currentColor" /></i><i className="pin-three"><MapPin fill="currentColor" /></i></div></div></div></section>

    <section id="contacto" className="vitae-final"><div><h2>Tu próxima sonrisa empieza aquí.</h2><p>Experience the Vitae difference. Schedule your comprehensive evaluation today.</p><Cta>Book Your Appointment</Cta></div></section>
  </main>
}
