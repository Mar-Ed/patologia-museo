// One observer for the whole site. No scroll listener or animation library.
export const revealSelectors = [
  "main [data-scroll-reveal]", "main [data-reveal-initial]", "main > section:first-child h1",
  "main > section:first-child > div > p", "main > section:first-child aside > img",
  "main .page-intro .eyebrow", "main .page-intro h1", "main .page-intro p",
  "main .section-head", "main .scientific-card",
  "main .prose-mpv > h2", "main .prose-mpv > h3", "main .prose-mpv > p",
  "main .prose-mpv > blockquote", "main .prose-mpv > ul", "main .not-prose > div",
  "main .home-acknowledgments .site-shell > div", "main .case-hero-image",
  "main .case-hero-copy > h1", "main .case-labels", "main .case-lead", "main .case-hero-bottom",
  "main .chapter-heading", "main .scientific-section", "main .clinical-insight",
  "main .diagnostic-principle", "main .local-case", "main .scientific-study",
  "main .scientific-references > a", "main .gallery-heading", "main .gallery-image",
  "main .video-record", "main .case-footer-note",
  ".site-footer .footer-layout > div", ".site-footer .footer-layout + div",
].join(",");

export const staggerDelay = (index: number, columns: number) => (index % Math.max(1, Math.min(columns, 4))) * 60;

type RevealState = {
  visible: boolean;
  entering: boolean;
  image: boolean;
  delay: number;
  animation?: Animation;
};

export function installScrollReveal(root: Document): () => void {
  const view = root.defaultView as (Window & typeof globalThis) | null;
  if (!view?.IntersectionObserver || !view.MutationObserver || !view.matchMedia || !view.Element?.prototype.animate) return () => {};
  const preference = view.matchMedia("(prefers-reduced-motion: reduce)");
  // State lives outside the DOM. Never mutate React-owned classes, styles or attributes:
  // layout effects can run while a streamed/Suspense subtree is still hydrating.
  const tracked = new Map<HTMLElement, RevealState>();
  let intersection: IntersectionObserver | undefined;
  let mutations: MutationObserver | undefined;
  let active = false;

  function cancel(state: RevealState) {
    if (state.animation) {
      state.animation.onfinish = null;
      state.animation.cancel();
      state.animation = undefined;
    }
    state.entering = false;
  }

  function wait(element: HTMLElement, state: RevealState) {
    cancel(state);
    state.visible = false;
    // Opacity-only at rest: translated geometry must never trigger its own observer.
    state.animation = element.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both" });
  }

  function resetAfterExit(element: HTMLElement, state: RevealState, rect: Pick<DOMRectReadOnly, "top" | "bottom">) {
    if (!element.contains(root.activeElement) && !element.querySelector(".video-stage iframe") && (rect.bottom <= 0 || rect.top >= view!.innerHeight)) wait(element, state);
  }

  function reveal(element: HTMLElement, state: RevealState, animated: boolean) {
    cancel(state);
    state.visible = true;
    if (!animated) return;
    const from: Keyframe = { opacity: 0, translate: "0 18px" };
    const to: Keyframe = { opacity: 1, translate: "0 0" };
    if (state.image) { from.scale = ".98"; to.scale = "1"; }
    const animation = element.animate([from, to], {
      duration: state.image ? 600 : 540, delay: state.delay,
      easing: "cubic-bezier(.22,1,.36,1)", fill: "both",
    });
    state.animation = animation;
    state.entering = true;
    animation.onfinish = () => {
      if (tracked.get(element) !== state || state.animation !== animation) return;
      // Release the effect instead of commitStyles(): no inline style mutations.
      cancel(state);
      resetAfterExit(element, state, element.getBoundingClientRect());
    };
  }

  function trackedAncestor(element: HTMLElement | null): HTMLElement | undefined {
    for (let current = element; current; current = current.parentElement) {
      if (tracked.has(current)) return current;
    }
  }

  function register(element: HTMLElement, initial: boolean) {
    if (tracked.has(element) || element.closest('dialog,[hidden],[aria-hidden="true"],[data-motion="off"]')) return;
    if (trackedAncestor(element.parentElement)) return;
    const rect = element.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) return;
    const siblings = element.parentElement ? Array.from(element.parentElement.children).filter(child => child.matches(revealSelectors)) : [element];
    let columns = 1;
    if (element.parentElement) {
      const layout = view!.getComputedStyle(element.parentElement);
      if (layout.display === "grid") columns = layout.gridTemplateColumns.split(/\s+/).length;
      else if (element.matches("h1,p,.eyebrow,.case-labels,.case-lead,.case-hero-bottom")) columns = 3;
    }
    const customDelay = Number(element.dataset.revealDelay);
    const delay = element.dataset.revealDelay !== undefined && Number.isFinite(customDelay)
      ? Math.max(0, Math.min(customDelay, 600))
      : staggerDelay(Math.max(0, siblings.indexOf(element)), columns);
    const state: RevealState = {
      visible: false, entering: false, delay,
      image: element.matches(".case-hero-image,.gallery-image,.video-record,img,[data-scroll-reveal='image']"),
    };
    tracked.set(element, state);
    const focused = element.contains(root.activeElement);
    const initiallyVisible = initial && rect.bottom > 0 && rect.top < view!.innerHeight;
    if (focused || initiallyVisible) reveal(element, state, !focused && element.dataset.revealInitial !== undefined);
    else wait(element, state);
    intersection?.observe(element);
  }

  function scan(initial: boolean) {
    root.querySelectorAll<HTMLElement>(revealSelectors).forEach(element => register(element, initial));
  }

  function revealFocus(event: FocusEvent) {
    const element = trackedAncestor(event.target as HTMLElement | null);
    if (element) reveal(element, tracked.get(element)!, false);
  }

  function stop() {
    intersection?.disconnect();
    mutations?.disconnect();
    root.removeEventListener("focusin", revealFocus);
    tracked.forEach(cancel);
    tracked.clear();
    active = false;
  }

  function start() {
    if (active || preference.matches) return;
    active = true;
    intersection = new view!.IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const state = tracked.get(element);
        if (!state) continue;
        if (entry.isIntersecting) {
          if (!state.visible) reveal(element, state, true);
        } else if (!state.entering) {
          resetAfterExit(element, state, entry.boundingClientRect);
        }
      }
    }, { threshold: 0 });
    scan(true);
    mutations = new view!.MutationObserver(records => {
      for (const [element, state] of tracked) {
        if (!element.isConnected) {
          intersection?.unobserve(element);
          cancel(state);
          tracked.delete(element);
        }
      }
      if (records.some(record => record.addedNodes.length > 0)) {
        const newPage = records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && ((node as Element).matches("main") || (node as Element).querySelector("main"))));
        scan(newPage);
      }
    });
    mutations.observe(root.body, { childList: true, subtree: true });
    root.addEventListener("focusin", revealFocus);
  }

  function updatePreference() { if (preference.matches) stop(); else start(); }
  preference.addEventListener("change", updatePreference);
  start();
  return () => { stop(); preference.removeEventListener("change", updatePreference); };
}
