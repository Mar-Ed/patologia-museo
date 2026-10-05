"use client";

import { useEffect } from "react";
import { installScrollReveal } from "@/lib/scroll-reveal";

export function ScrollRevealController() {
  useEffect(() => installScrollReveal(document), []);
  return null;
}
