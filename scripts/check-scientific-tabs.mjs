import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readModule } from "./content-modules.mjs";

const { Tabs, TabsList, TabsTrigger, TabsContent } = readModule("components/scientific-tabs.tsx");
let galleryMounted = false;
function GalleryProbe() { galleryMounted = true; return React.createElement("p", null, "Gallery loaded"); }
const tree = value => React.createElement(Tabs, { value, onValueChange: () => {} },
  React.createElement(TabsList, {}, ...["panorama", "galeria"].map(id => React.createElement(TabsTrigger, { value: id, key: id }, id))),
  React.createElement(TabsContent, { value: "panorama" }, "Scientific content"),
  React.createElement(TabsContent, { value: "diagnostico" }, "Diagnostic content available without clicks"),
  React.createElement(TabsContent, { value: "galeria", lazy: true }, React.createElement(GalleryProbe)),
);
const initial = renderToStaticMarkup(tree("panorama"));
assert.equal(galleryMounted, false);
assert.equal((initial.match(/aria-selected="true"/g) ?? []).length, 1);
assert.ok(initial.includes('role="tabpanel"'));
assert.ok(initial.includes("Diagnostic content available without clicks"));
assert.ok(initial.includes('aria-controls='));
assert.ok(!initial.includes("Gallery loaded"));
renderToStaticMarkup(tree("galeria"));
assert.equal(galleryMounted, true);

let focused = -1, selected = -1;
const buttons = Array.from({ length: 6 }, (_, i) => ({ focus: () => { focused = i; }, click: () => { selected = i; } }));
const handler = TabsList({ children: null }).props.onKeyDown;
for (const [key, index, next] of [["ArrowRight", 5, 0], ["ArrowLeft", 0, 5], ["Home", 3, 0], ["End", 2, 5]]) {
  let prevented = false;
  handler({ key, target: buttons[index], currentTarget: { querySelectorAll: () => buttons }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(focused, next);
  assert.equal(selected, next);
}
console.log("Scientific tabs: inactive gallery does not mount, ARIA selection and keyboard navigation OK.");
