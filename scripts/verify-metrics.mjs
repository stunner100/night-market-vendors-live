import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const roster = JSON.parse(
  readFileSync(join(root, "src/data/roster.json"), "utf8")
);

function brandKey(name) {
  return name.trim().toLowerCase();
}

const roseline = roster.roseline.vendors;
const ibrahim = roster.ibrahim.brands;
const unique = new Set(ibrahim.map((row) => brandKey(row.name)));
const chains = ibrahim.filter((row) => typeof row.branches === "number");
const chainKeys = new Set(chains.map((row) => brandKey(row.name)));
const chainLocations = chains.reduce((sum, row) => sum + row.branches, 0);
const singles = ibrahim.filter(
  (row) => typeof row.branches !== "number" && !chainKeys.has(brandKey(row.name))
).length;

const week2 = roster.augustContext.weeks[0];
const week3 = roster.augustContext.weeks[1];

assert.equal(roseline.length, 54, "Roseline must have 54 vendors");
assert.equal(ibrahim.length, 25, "Ibrahim must have 25 submitted rows");
assert.equal(unique.size, 24, "MaxMart de-dupe should yield 24 unique brands");
assert.equal(chainLocations, 80, "Seven chains should sum to 80 locations");
assert.equal(chains.length, 7, "There should be 7 chain rows");
assert.equal(singles, 17, "Ibrahim singles should be 17");
assert.equal(roster.overlaps.length, 3, "There should be 3 overlaps");
assert.equal(week2.fullyOnboarded + week3.fullyOnboarded, 54);
assert.equal(week2.reviewed + week3.reviewed, 73);
assert.equal(roseline[51], "Cheezy Pizza Adenta");
assert.equal(roseline[52], "Papas Pizza North Legon");
assert.equal(roseline[53], "Eddys Pizza Tema C8");
assert.equal(roseline[0], "Chief Bigs Food");
assert.equal(ibrahim[0].name, "Waakye Boss");
assert.equal(ibrahim[24].name, "Boldmade Restaurant");
assert.ok(roster.notes.maxMart.includes("MaxMart appears twice"));

console.log("Metrics verified:");
console.log({
  roselineLive: roseline.length,
  ibrahimSubmitted: ibrahim.length,
  ibrahimUniqueBrands: unique.size,
  ibrahimChainLocations: chainLocations,
  ibrahimSingles: singles,
  overlaps: roster.overlaps.length,
  combinedReviewed: week2.reviewed + week3.reviewed,
  combinedOnboarded: week2.fullyOnboarded + week3.fullyOnboarded,
});
