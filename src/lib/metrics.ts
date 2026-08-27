import roster from "@/data/roster.json";
import { inferCuisineTags } from "@/lib/cuisine";

export type FilterId = "all" | "roseline" | "ibrahim" | "chains" | "overlap";

export type RoselineVendor = {
  stall: number;
  name: string;
  owner: "roseline";
  tags: string[];
  overlap: boolean;
  overlapChain: string | null;
};

export type IbrahimBrand = {
  stall: number;
  name: string;
  owner: "ibrahim";
  tags: string[];
  branches: number | null;
  isChain: boolean;
  isDuplicateName: boolean;
  brandKey: string;
  overlapLocations: string[];
};

export function brandKey(name: string): string {
  return name.trim().toLowerCase();
}

export function getRoster() {
  return roster;
}

export function getRoselineVendors(): RoselineVendor[] {
  const overlapByName = new Map(
    roster.overlaps.map((row) => [row.roselineName, row.ibrahimChain])
  );

  return roster.roseline.vendors.map((name, index) => ({
    stall: index + 1,
    name,
    owner: "roseline" as const,
    tags: inferCuisineTags(name),
    overlap: overlapByName.has(name),
    overlapChain: overlapByName.get(name) ?? null,
  }));
}

export function getIbrahimBrands(): IbrahimBrand[] {
  const seen = new Map<string, number>();
  const overlapByChain = new Map<string, string[]>();
  for (const row of roster.overlaps) {
    const list = overlapByChain.get(row.ibrahimChain) ?? [];
    list.push(row.roselineName);
    overlapByChain.set(row.ibrahimChain, list);
  }

  return roster.ibrahim.brands.map((brand, index) => {
    const key = brandKey(brand.name);
    const prior = seen.get(key) ?? 0;
    seen.set(key, prior + 1);
    const branches = "branches" in brand && typeof brand.branches === "number"
      ? brand.branches
      : null;

    return {
      stall: index + 1,
      name: brand.name,
      owner: "ibrahim" as const,
      tags: inferCuisineTags(brand.name),
      branches,
      isChain: branches !== null,
      isDuplicateName: prior > 0,
      brandKey: key,
      overlapLocations: overlapByChain.get(brand.name) ?? [],
    };
  });
}

export function computeMetrics() {
  const roseline = getRoselineVendors();
  const ibrahim = getIbrahimBrands();

  const uniqueBrandKeys = new Set(ibrahim.map((row) => row.brandKey));
  const chainRows = ibrahim.filter((row) => row.isChain);
  const chainKeys = new Set(chainRows.map((row) => row.brandKey));
  const chainLocations = chainRows.reduce((sum, row) => sum + (row.branches ?? 0), 0);
  const singles = ibrahim.filter(
    (row) => !row.isChain && !chainKeys.has(row.brandKey)
  ).length;

  const week2 = roster.augustContext.weeks[0];
  const week3 = roster.augustContext.weeks[1];
  const combinedReviewed = week2.reviewed + week3.reviewed;
  const combinedOnboarded = week2.fullyOnboarded + week3.fullyOnboarded;

  return {
    asOfLabel: roster.asOfLabel,
    roselineLive: roseline.length,
    ibrahimSubmitted: ibrahim.length,
    ibrahimUniqueBrands: uniqueBrandKeys.size,
    ibrahimChainLocations: chainLocations,
    ibrahimChains: chainRows.length,
    ibrahimSingles: singles,
    overlaps: roster.overlaps.length,
    uniqueLiveBrands:
      roseline.length + uniqueBrandKeys.size - roster.overlaps.length,
    week2,
    week3,
    combinedReviewed,
    combinedOnboarded,
    week2Rate: week2.fullyOnboarded / week2.reviewed,
    week3Rate: week3.fullyOnboarded / week3.reviewed,
    maxMartNote: roster.notes.maxMart,
    contextDisclaimer: roster.augustContext.disclaimer,
  };
}

export function getChainBreakdown() {
  return getIbrahimBrands()
    .filter((row) => row.isChain)
    .map((row) => ({
      name: row.name,
      branches: row.branches ?? 0,
      overlapLocations: row.overlapLocations,
    }));
}
