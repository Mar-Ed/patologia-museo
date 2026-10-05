"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Pathology } from "@/lib/pathologies";

export function PathologyCard({ item }: { item: Pathology }) {
  const [intent, setIntent] = useState(false);
  // Prefetch only the case the visitor points at, focuses, or touches.
  return <Link href={`/patologias/${item.slug}`} prefetch={intent} onMouseEnter={() => setIntent(true)} onFocus={() => setIntent(true)} onTouchStart={() => setIntent(true)} className="scientific-card"><div className="scientific-card-meta"><span>{item.species === "Por determinar" ? "Colección veterinaria" : item.species}</span><small>{item.id}</small></div><div className="scientific-card-heading"><h2>{item.name}</h2>{item.cover && <Image src={item.coverThumbnail ?? item.cover} alt={`Espécimen de ${item.name}`} width={140} height={160} sizes="100px" unoptimized={(item.coverThumbnail ?? item.cover).startsWith("/media/")} className="scientific-card-image" />}</div><p>{item.summary}</p><div className="scientific-card-link"><span>Estudiar patología</span><ArrowUpRight size={18} /></div></Link>;
}
