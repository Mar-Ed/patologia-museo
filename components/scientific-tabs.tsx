"use client";

import { createContext, useContext, useId, type ReactNode, type KeyboardEvent } from "react";

type Selection = { value: string; onValueChange: (value: string) => void; id: string };
const SelectionContext = createContext<Selection | null>(null);
function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("Scientific tabs require a selection provider");
  return context;
}

// A small, accessible implementation for this fixed six-tab scientific view.
// Scientific text is prerendered; only explicitly lazy media panels wait for selection.
export function Tabs({ value, onValueChange, className, children }: { value: string; onValueChange: (value: string) => void; className?: string; children: ReactNode }) {
  const id = useId();
  return <SelectionContext.Provider value={{ value, onValueChange, id }}><div className={className}>{children}</div></SelectionContext.Provider>;
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  }
  return <div role="tablist" aria-label="Secciones de la ficha científica" className={className} onKeyDown={navigate}>{children}</div>;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const selection = useSelection();
  const active = value === selection.value;
  return <button type="button" role="tab" id={`${selection.id}-${value}-tab`} aria-controls={`${selection.id}-${value}-panel`} aria-selected={active} tabIndex={active ? 0 : -1} data-state={active ? "active" : "inactive"} className={className} onClick={() => selection.onValueChange(value)}>{children}</button>;
}

export function TabsContent({ value, children, lazy = false }: { value: string; children: ReactNode; lazy?: boolean }) {
  const selection = useSelection();
  const active = value === selection.value;
  return <div role="tabpanel" id={`${selection.id}-${value}-panel`} aria-labelledby={`${selection.id}-${value}-tab`} tabIndex={0} hidden={!active}>{active || !lazy ? children : null}</div>;
}
