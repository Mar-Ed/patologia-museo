"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["/", "Inicio"], ["/museo", "El museo"], ["/catalogo", "Colección"], ["/educacion", "Área educativa"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f3ee]/92 backdrop-blur-xl">
    <div className="mx-auto flex min-h-19 w-[min(1180px,calc(100%-40px))] items-center gap-8">
      <Link href="/" className="mr-auto flex items-center gap-3" onClick={() => setOpen(false)}>
        <Image src="/logo.png" width={48} height={48} alt="" className="size-12 object-contain" priority />
        <span className="leading-none"><strong className="font-serif text-[1.08rem] font-semibold">Museo de Patología<br />Veterinaria</strong><small className="mt-1 block text-[.68rem] uppercase tracking-[.12em] text-[#66706c]">UNC · Ciencias Veterinarias</small></span>
      </Link>
      <button className="grid size-11 place-items-center md:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-19 flex-col gap-4 border-b border-black/10 bg-[#f5f3ee] p-6 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`} aria-label="Navegación principal">
        {links.map(([href, label]) => <Link key={href} href={href} className="text-sm font-medium hover:text-[#7a2c2c]" onClick={() => setOpen(false)}>{label}</Link>)}
      </nav>
    </div>
  </header>;
}
