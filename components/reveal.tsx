import type { PropsWithChildren } from "react";

export function Reveal({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  // The shared viewport controller reveals the child sections; SSR stays visible.
  return <div className={className} data-reveal-group="">{children}</div>;
}
