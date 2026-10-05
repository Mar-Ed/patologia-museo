import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

const email = "museodepatologiaveterinaria@gmail.com";
const locationUrl = "https://maps.app.goo.gl/Cq2YPHdNuV9F4rLS6?g_st=ac";
const mapUrl = "https://www.google.com/maps?q=Hospital%20Veterinario%20de%20la%20UNC%2C%20Av.%20Universitaria%2C%20Cajamarca%2006002&output=embed";

export function SiteFooter() {
  return <footer className="site-footer bg-[#0e1110] py-16 text-[#d9dedb]"><div className="site-shell">
    <div className="footer-layout">
      <div className="footer-brand"><h2 className="font-serif text-2xl text-white">Museo de Patología Veterinaria</h2><p className="mt-4 max-w-md text-[#aeb7b2]">Espacio académico para conservar, estudiar y divulgar alteraciones anatómicas y enfermedades animales.</p><p className="mt-5 text-sm text-[#aeb7b2]">Facultad de Ciencias Veterinarias<br />Universidad Nacional de Cajamarca</p><a className="footer-email" href={`mailto:${email}`}><Mail size={17} aria-hidden="true" /><span>{email}</span></a></div>
      <div><strong className="text-white">Explorar</strong><Link className="mt-3 block text-[#aeb7b2] hover:text-white" href="/catalogo">Catálogo general</Link><Link className="mt-2 block text-[#aeb7b2] hover:text-white" href="/patologias/milagritos">Caso Milagritos</Link><Link className="mt-2 block text-[#aeb7b2] hover:text-white" href="/educacion">Recursos educativos</Link></div>
      <div className="footer-location"><strong className="text-white">Ubicación</strong><div className="footer-map-preview"><iframe src={mapUrl} title="Mapa del Hospital Veterinario de la UNC en Cajamarca" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" tabIndex={-1} /><a className="footer-map-link" href={locationUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver ubicación del Hospital Veterinario de la UNC en Google Maps"><span>Ver en Google Maps<ArrowUpRight size={16} aria-hidden="true" /></span></a></div><a className="footer-address" href={locationUrl} target="_blank" rel="noopener noreferrer"><MapPin size={18} aria-hidden="true" /><span>Hospital Veterinario de la UNC<small>Av. Universitaria · Cajamarca, Perú</small></span></a></div>
    </div><div className="mt-12 border-t border-white/10 pt-6 text-xs text-[#89928d]">© 2026 Universidad Nacional de Cajamarca · Facultad de Ciencias Veterinarias.</div>
  </div></footer>;
}
