import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readModule } from "./content-modules.mjs";

const { installScrollReveal, revealSelectors, staggerDelay } = readModule("lib/scroll-reveal.ts");

function fixture(reduced = false, initialDelay) {
  const observers = [], mutations = [], preferenceListeners = new Set(), listeners = new Map();
  const preference = { matches: reduced, addEventListener: (_name, fn) => preferenceListeners.add(fn), removeEventListener: (_name, fn) => preferenceListeners.delete(fn) };
  const forbidden = () => { throw new Error("Animation mutated React-owned HTML during hydration"); };
  class Element {
    constructor(top, parent = null, image = false, delay) {
      this.rect = { top, bottom: top + 100, width: 240, height: 100 };
      this.parentElement = parent; this.children = []; this.isConnected = true;
      this.dataset = Object.freeze(delay === undefined ? {} : { revealInitial: "", revealDelay: String(delay) });
      Object.defineProperty(this, "className", { value: "server-rendered-class", writable: false });
      this.classList = { add: forbidden, remove: forbidden };
      this.style = { setProperty: forbidden, removeProperty: forbidden };
      this.setAttribute = forbidden; this.removeAttribute = forbidden;
      this.image = image; this.selected = true; this.nodeType = 1; this.animations = [];
      parent?.children.push(this);
    }
    animate(keyframes, options) {
      const animation = { keyframes, options, onfinish: null, cancelled: false,
        cancel() { this.cancelled = true; }, finish() { if (!this.cancelled) this.onfinish?.(); },
      };
      this.animations.push(animation);
      return animation;
    }
    effect() { return this.animations.findLast(animation => !animation.cancelled); }
    hiddenByMotion() { return this.effect()?.keyframes.every(frame => frame.opacity === 0) ?? false; }
    getBoundingClientRect() { return this.rect; }
    closest(selector) {
      if (selector.includes("[hidden]") && this.hidden) return this;
      return this.parentElement?.closest(selector) ?? null;
    }
    matches(selector) { return selector === "main" ? !!this.main : selector === revealSelectors ? this.selected : selector.includes(".gallery-image") ? this.image : false; }
    contains(node) { for (let child = node; child; child = child.parentElement) if (child === this) return true; return false; }
    querySelector(selector) { return selector.includes("iframe") && this.playing ? {} : null; }
  }
  class Intersection {
    constructor(callback, options) { this.callback = callback; this.options = options; this.elements = new Set(); observers.push(this); }
    observe(element) { this.elements.add(element); }
    unobserve(element) { this.elements.delete(element); }
    disconnect() { this.disconnected = true; this.elements.clear(); }
    emit(element, visible, top) {
      element.rect = { ...element.rect, top, bottom: top + element.rect.height };
      this.callback([{ target: element, isIntersecting: visible, boundingClientRect: element.rect }]);
    }
  }
  class Mutation {
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const parent = new Element(0); parent.selected = false;
  const first = new Element(20, parent, false, initialDelay), second = new Element(1000, parent, true);
  const root = {
    body: {}, activeElement: null, elements: [first, second],
    defaultView: { Element, innerHeight: 800, IntersectionObserver: Intersection, MutationObserver: Mutation, matchMedia: () => preference, getComputedStyle: () => ({ display: "grid", gridTemplateColumns: "240px 240px 240px" }) },
    querySelectorAll() { return this.elements; },
    addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type),
  };
  return { root, parent, first, second, Element, observers, mutations, listeners, preference, preferenceListeners };
}

for (const [index, columns, delay] of [[0, 3, 0], [1, 3, 60], [2, 3, 120], [3, 3, 0], [3, 4, 180], [10, 1, 0]]) assert.equal(staggerDelay(index, columns), delay);
const f = fixture();
const cleanup = installScrollReveal(f.root);
assert.equal(f.observers.length, 1);
assert.equal(f.first.effect(), undefined, "Ordinary initial content must remain immediately visible");
assert.equal(f.second.hiddenByMotion(), true);
assert.ok(!f.second.effect().keyframes.some(frame => frame.translate), "Waiting geometry must stay stable");
const io = f.observers[0];
io.emit(f.second, true, 650);
assert.equal(f.second.effect().options.duration, 600);
assert.equal(f.second.effect().options.delay, 60);
assert.equal(f.second.effect().keyframes[0].scale, ".98");
const entering = f.second.effect();
io.emit(f.second, false, 810);
assert.equal(f.second.effect(), entering, "Ignore animation-induced transient exits");
io.emit(f.second, true, 650);
entering.finish();
assert.equal(f.second.effect(), undefined, "Release effects at rest, without commitStyles");
io.emit(f.second, false, -150);
assert.equal(f.second.hiddenByMotion(), true);
io.emit(f.second, true, 40);
assert.equal(f.second.effect().options.duration, 600, "Replay upward");
f.second.effect().finish();
io.emit(f.second, false, 850);
assert.equal(f.second.hiddenByMotion(), true);
io.emit(f.second, true, 700);
assert.equal(f.second.effect().options.duration, 600, "Replay downward");
f.second.effect().finish();
io.emit(f.second, false, -50);
assert.equal(f.second.effect(), undefined, "Do not hide partially visible content");

f.root.activeElement = f.first;
io.emit(f.first, false, -150);
assert.equal(f.first.effect(), undefined, "Focused content stays visible");
f.root.activeElement = null;
io.emit(f.first, false, -150);
assert.equal(f.first.hiddenByMotion(), true);
const focusChild = new f.Element(-140, f.first);
f.listeners.get("focusin")({ target: focusChild });
assert.equal(f.first.effect(), undefined, "Focus reveals a tracked ancestor immediately");
f.second.playing = true;
io.emit(f.second, false, -150);
assert.equal(f.second.effect(), undefined, "Keep playing embedded videos visible");

const inserted = new f.Element(400, f.parent);
f.root.elements.push(inserted);
f.mutations[0].callback([{ addedNodes: [inserted] }]);
assert.ok(io.elements.has(inserted));
assert.equal(inserted.hiddenByMotion(), true);
io.emit(inserted, true, 400);
assert.equal(inserted.effect().options.duration, 540);
const nested = new f.Element(450, inserted);
f.root.elements.push(nested);
f.mutations[0].callback([{ addedNodes: [nested] }]);
assert.ok(!io.elements.has(nested), "Avoid nested simultaneous animation effects");
const removedAnimation = inserted.effect();
inserted.isConnected = false; nested.isConnected = false;
f.root.elements = f.root.elements.filter(element => element.isConnected);
f.mutations[0].callback([{ addedNodes: [] }]);
assert.ok(!io.elements.has(inserted));
assert.ok(removedAnimation.cancelled, "Cancel disconnected elements");
io.emit(inserted, true, 400);
assert.equal(inserted.effect(), undefined, "Ignore queued events for removed elements");

const newPage = new f.Element(0); newPage.main = true; newPage.selected = false;
const hero = new f.Element(20, newPage);
f.root.elements.push(hero);
f.mutations[0].callback([{ addedNodes: [newPage] }]);
assert.equal(hero.effect(), undefined, "Ordinary route-entry content remains visible");
f.preference.matches = true; f.preferenceListeners.forEach(fn => fn());
assert.equal(io.disconnected, true);
assert.ok(f.root.elements.every(element => !element.effect()), "Reduced motion cancels all owned effects");
f.preference.matches = false; f.preferenceListeners.forEach(fn => fn());
assert.equal(f.observers.length, 2);
assert.equal(f.listeners.has("scroll"), false);
cleanup();
assert.equal(f.listeners.size, 0);
assert.equal(f.preferenceListeners.size, 0);
assert.ok(f.root.elements.every(element => !element.effect()));

const entrance = fixture(false, 210);
const cleanupEntrance = installScrollReveal(entrance.root);
assert.equal(entrance.first.effect().options.delay, 210);
assert.equal(entrance.first.effect().options.duration, 540, "Initial hero entrance must remain animated");
assert.equal(entrance.second.hiddenByMotion(), true, "Mobile below-fold hero waits for visibility");
const initialAnimation = entrance.first.effect();
entrance.observers[0].emit(entrance.first, true, 20);
assert.equal(entrance.first.effect(), initialAnimation);
initialAnimation.finish();
entrance.observers[0].emit(entrance.first, false, -150);
entrance.observers[0].emit(entrance.first, true, 20);
assert.equal(entrance.first.effect().options.duration, 540);
const homeRoute = new entrance.Element(0); homeRoute.main = true; homeRoute.selected = false;
const homeTitle = new entrance.Element(20, homeRoute, false, 70);
entrance.root.elements.push(homeTitle);
entrance.mutations[0].callback([{ addedNodes: [homeRoute] }]);
assert.equal(homeTitle.effect().options.delay, 70, "Animate client navigation arrival");
cleanupEntrance();
assert.ok(!entrance.first.effect() && !homeTitle.effect());

const reduced = fixture(true, 210);
installScrollReveal(reduced.root)();
assert.equal(reduced.observers.length, 0);
assert.equal(reduced.first.effect(), undefined);
const unsupported = fixture();
unsupported.root.defaultView.Element = class {};
installScrollReveal(unsupported.root)();
assert.equal(unsupported.observers.length, 0);
installScrollReveal({ defaultView: {} })();

function cssFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? cssFiles(file) : file.endsWith(".css") ? [fs.readFileSync(file, "utf8")] : [];
  });
}
const css = cssFiles(".next/static").join("\n");
assert.ok(css.includes(".button-primary:hover"), "Hover effects survive production");
assert.match(css, /prefers-reduced-motion/);
assert.ok(!css.includes("data-motion-state"), "Remove obsolete attribute-driven effects");
for (const page of ["index", "catalogo", "museo", "educacion", "patologias/pleuritis-cronica-granulomatosa", "patologias/palatosquisis-y-escoliosis-en-bovino"]) {
  const html = fs.readFileSync(`.next/server/app/${page}.html`, "utf8");
  assert.ok(!/data-motion-state|data-motion-kind|motion-reveal/.test(html), "React's server HTML stays unchanged and readable");
  if (page === "index") assert.equal((html.match(/data-reveal-initial=""/g) ?? []).length, 10);
  if (["museo", "educacion", "catalogo"].includes(page)) {
    const intro = html.match(/<section class="page-intro">([\s\S]*?)<\/section>/)?.[1];
    assert.ok(intro);
    assert.equal((intro.match(/data-reveal-initial=""/g) ?? []).length, page === "catalogo" ? 4 : 3);
    assert.match(intro, /<h1[^>]*data-reveal-initial=""/);
    assert.match(intro, /<p[^>]*data-reveal-initial=""/);
  }
}
console.log("Motion: immutable HTML during delayed hydration, initial entrances, bidirectional replay, navigation, focus, video safety, reduced motion, effect cleanup, fallback and production CSS/SSR OK.");
