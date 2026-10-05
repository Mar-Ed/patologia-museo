import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { readModule } from "./content-modules.mjs";

// Component-level tests with a controlled hook/router harness, not a browser benchmark.
const metadata = readModule("lib/pathologies.ts");
const navigation = readModule("lib/catalog-navigation.ts", { "./pathologies": metadata });
const items = JSON.parse(fs.readFileSync(".generated/catalog.json", "utf8"));
const states = [];
let cursor = 0, pathname = "/catalogo", requests = 0;
const history = [pathname];
let historyIndex = 0;
const canonical = { href: "" }, description = { content: "" };
const document = { title: "", querySelector: selector => selector.includes("canonical") ? canonical : description };
function Card() { return null; }
const hooks = {
  ...React,
  useMemo: fn => fn(), useEffect: fn => fn(),
  useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
  },
};
const stub = () => null;
const { CatalogBrowser } = readModule("components/catalog-browser.tsx", {
  react: hooks, "next/link": stub, "next/navigation": { usePathname: () => pathname },
  "lucide-react": { Search: stub }, "@/components/ui/input": { Input: stub },
  "@/components/ui/native-select": { NativeSelect: stub, NativeSelectOption: stub },
  "@/components/pathology-card": { PathologyCard: Card }, "@/lib/pathologies": metadata,
  "@/lib/catalog-navigation": navigation,
  "@/lib/site-config": readModule("lib/site-config.ts"),
  "@/lib/catalog-pagination": readModule("lib/catalog-pagination.ts"),
}, {
  document, fetch: () => { requests++; throw new Error("Filtering must not fetch"); },
  window: { history: { pushState: (_data, _title, url) => { history.splice(++historyIndex); history.push(url); pathname = url; } } },
});
const allNodes = element => Array.isArray(element) ? element.flatMap(allNodes) : !element || typeof element !== "object" ? [] : [element, ...allNodes(element.props?.children)];
function render() { cursor = 0; return allNodes(CatalogBrowser({ items })); }
function clickCategory(category, modified = false) {
  let prevented = false;
  const link = render().find(node => node.props?.href === navigation.catalogPath(category) && node.props?.["aria-current"] !== undefined || node.props?.href === navigation.catalogPath(category) && node.props?.className?.includes("rounded-full"));
  link.props.onClick({ button: 0, metaKey: false, ctrlKey: modified, shiftKey: false, altKey: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, !modified);
  return render();
}
const cardCount = nodes => nodes.filter(node => node.type === Card).length;
assert.equal(cardCount(render()), 24);
const more = render().find(node => node.type === "button" && node.props.children === "Cargar más patologías");
more.props.onClick();
assert.equal(cardCount(render()), 48);
assert.equal(cardCount(clickCategory("adquirida")), items.filter(item => item.category === "adquirida").length);
assert.equal(pathname, "/catalogo/adquirida");
assert.ok(document.title.includes("Adquirida"));
assert.equal(canonical.href, "https://www.museopatologiaveterinaria.com/catalogo/adquirida");
pathname = history[--historyIndex];
assert.equal(cardCount(render()), 48); // Back preserves the earlier pagination state.
pathname = history[++historyIndex];
assert.equal(cardCount(render()), 8);
clickCategory("desarrollo", true);
assert.equal(pathname, "/catalogo/adquirida");
clickCategory("all");
pathname = "/catalogo/pagina/2";
assert.equal(cardCount(render()), 24);
assert.equal(render().find(node => node.type === Card).props.item.slug, items[24].slug);
assert.equal(canonical.href, "https://www.museopatologiaveterinaria.com/catalogo/pagina/2");
assert.ok(document.title.includes("Página 2"));
assert.ok(render().some(node => node.props?.href === "/catalogo/pagina/3"));
clickCategory("all");
assert.equal(pathname, "/catalogo");
const last = items.at(-1);
const input = render().find(node => node.props?.placeholder === "Buscar patología, especie o código");
input.props.onChange({ target: { value: last.id } });
const matches = render().filter(node => node.type === Card);
assert.equal(matches.length, 1);
assert.equal(matches[0].props.item.slug, last.slug); // Search covers records outside the first 24.
clickCategory(last.category);
assert.equal(render().find(node => node.props?.placeholder)?.props.value, last.id);
assert.equal(cardCount(render()), 1);
assert.equal(requests, 0);
console.log("Catalog component: instant categories, preserved search, load-more, Back/Forward, metadata and modified clicks OK; no fetch calls.");
