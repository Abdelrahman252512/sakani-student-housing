import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Keep every locked copy above the patched version, not just direct dependencies.
const patchedVersions = {
  "body-parser": { 1: "1.20.9", 2: "2.4.0" },
  postcss: { 8: "8.5.23" },
  "prosemirror-view": { 1: "1.42.3" },
  zod: { 4: "4.6.6" },
  undici: { 6: "6.29.1", 7: "7.30.1", 8: "8.12.2" },
  esbuild: { 0: "0.25.0" },
  "postcss-selector-parser": { 6: "6.1.5", 7: "7.1.6" },
  "fast-uri": { 3: "3.1.9", 4: "4.2.1" },
};

function checkVersions(packages, expected) {
  const seen = new Set();
  for (const [name, version] of packages) {
    if (!(name in patchedVersions)) continue;
    seen.add(name);
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name}: unexpected release`);
    const installed = version.split(".").map(Number);
    const floor = patchedVersions[name][installed[0]];
    assert.ok(floor, `${name}@${version}: no approved patched release line`);
    const minimum = floor.split(".").map(Number);
    const firstDifference = installed.findIndex((part, i) => part !== minimum[i]);
    assert.ok(
      firstDifference === -1 || installed[firstDifference] > minimum[firstDifference],
      `${name}@${version} must be at least ${floor}`,
    );
  }
  for (const name of expected) assert.ok(seen.has(name), `No locked ${name} checked`);
}

test("npm lockfile contains only patched versions of the affected dependencies", () => {
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  const packages = Object.entries(lock.packages).map(([path, entry]) => [
    path.split("node_modules/").at(-1),
    entry.version,
  ]);
  checkVersions(packages, ["postcss", "esbuild", "zod"]);
});

test("pnpm lockfile contains only patched versions of all eight affected packages", () => {
  const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
  const section = lock.split("\npackages:\n")[1]?.split("\nsnapshots:\n")[0];
  assert.ok(section, "Expected pnpm package resolutions");
  const packages = [...section.matchAll(/^ {2}([^ '\n]+)@(\d+\.\d+\.\d+):$/gm)]
    .map((match) => [match[1], match[2]]);
  checkVersions(packages, Object.keys(patchedVersions));
});
