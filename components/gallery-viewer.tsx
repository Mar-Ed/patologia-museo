"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

export function GalleryViewer({ images, name, initialIndex, onClose }: { images: string[]; name: string; initialIndex: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(initialIndex);
  const move = (step: number) => setActive(value => (value + step + images.length) % images.length);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="scientific-viewer" aria-label={`Fotografías de ${name}`} onClose={onClose} onKeyDown={event => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
    }
  }}>
    <div className="viewer-toolbar"><p>{name}</p><button autoFocus onClick={() => dialog.current?.close()} aria-label="Cerrar visor"><X size={21} /></button></div>
    <Image src={images[active]} alt={`Vista ampliada de ${name}`} width={1800} height={1500} sizes="95vw" className="viewer-photo" />
    <div className="viewer-controls"><button onClick={() => move(-1)} aria-label="Fotografía anterior"><ArrowLeft size={21} /></button><span>{active + 1} / {images.length}</span><button onClick={() => move(1)} aria-label="Fotografía siguiente"><ArrowRight size={21} /></button></div>
  </dialog>;
}
