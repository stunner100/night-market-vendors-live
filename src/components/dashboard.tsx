"use client";

import { Children, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  computeMetrics,
  getChainBreakdown,
  getIbrahimBrands,
  getRoselineVendors,
  getRoster,
  type FilterId,
  type IbrahimBrand,
  type RoselineVendor,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "roseline", label: "Roseline" },
  { id: "ibrahim", label: "Ibrahim" },
  { id: "chains", label: "Chains" },
  { id: "overlap", label: "Overlap" },
];

function matchesQuery(name: string, query: string) {
  if (!query) return true;
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function Dashboard() {
  const roster = getRoster();
  const metrics = computeMetrics();
  const roseline = useMemo(() => getRoselineVendors(), []);
  const ibrahim = useMemo(() => getIbrahimBrands(), []);
  const chains = useMemo(() => getChainBreakdown(), []);

  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const roselineVisible = useMemo(() => {
    return roseline.filter((row) => {
      if (!matchesQuery(row.name, query)) return false;
      if (filter === "ibrahim" || filter === "chains") return false;
      if (filter === "overlap") return row.overlap;
      return true;
    });
  }, [roseline, filter, query]);

  const ibrahimVisible = useMemo(() => {
    return ibrahim.filter((row) => {
      if (!matchesQuery(row.name, query) && !row.overlapLocations.some((loc) => matchesQuery(loc, query))) {
        return false;
      }
      if (filter === "roseline") return false;
      if (filter === "chains") return row.isChain;
      if (filter === "overlap") return row.overlapLocations.length > 0;
      return true;
    });
  }, [ibrahim, filter, query]);

  const showRoseline = filter === "all" || filter === "roseline" || filter === "overlap";
  const showIbrahim =
    filter === "all" || filter === "ibrahim" || filter === "chains" || filter === "overlap";
  const showChart = filter === "all" || filter === "ibrahim" || filter === "chains";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 market-atmosphere" aria-hidden />
      <div className="pointer-events-none absolute inset-0 market-grain" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <MarketHeader asOfLabel={metrics.asOfLabel} subtitle={roster.product.subtitle} />

        <KpiRow metrics={metrics} />

        <ContextStrip
          disclaimer={metrics.contextDisclaimer}
          week2={metrics.week2}
          week3={metrics.week3}
          combinedReviewed={metrics.combinedReviewed}
          combinedOnboarded={metrics.combinedOnboarded}
          week2Rate={metrics.week2Rate}
          week3Rate={metrics.week3Rate}
        />

        <OverlapAndDupNotes
          overlaps={roster.overlaps}
          maxMartNote={metrics.maxMartNote}
          uniqueBrands={metrics.ibrahimUniqueBrands}
          singles={metrics.ibrahimSingles}
        />

        <div className="sticky top-0 z-20 -mx-4 border-y border-amber-500/15 bg-[#120e0a]/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={filter === item.id ? "default" : "outline"}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "rounded-full border-amber-500/25",
                    filter === item.id
                      ? "bg-amber-400 text-[#1a1208] hover:bg-amber-300"
                      : "bg-transparent text-amber-100/80 hover:bg-amber-500/10"
                  )}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-amber-200/50" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stalls, brands, locations…"
                className="h-9 border-amber-500/20 bg-[#1c1510]/80 pl-8 text-amber-50 placeholder:text-amber-200/40"
                aria-label="Search vendors"
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-6",
            showRoseline && showIbrahim ? "lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          {showRoseline ? (
            <VendorColumn
              eyebrow="Taken Live"
              title={roster.roseline.name}
              countLabel={`${roselineVisible.length} of ${metrics.roselineLive}`}
              emptyLabel="No Roseline stalls match that search."
            >
              {roselineVisible.map((row) => (
                <RoselineRow key={row.stall} vendor={row} />
              ))}
            </VendorColumn>
          ) : null}

          {showIbrahim ? (
            <VendorColumn
              eyebrow={roster.ibrahim.role}
              title={`${roster.ibrahim.name} / ${roster.ibrahim.alsoKnownAs}`}
              countLabel={`${ibrahimVisible.length} of ${metrics.ibrahimSubmitted} submitted`}
              meta={`${metrics.ibrahimUniqueBrands} unique brands · ${metrics.ibrahimSingles} singles · ${metrics.ibrahimChainLocations} chain locations`}
              emptyLabel="No Ibrahim brands match that search."
            >
              {ibrahimVisible.map((row) => (
                <IbrahimRow key={`${row.stall}-${row.name}-${row.branches ?? "name"}`} brand={row} />
              ))}
            </VendorColumn>
          ) : null}
        </div>

        {showChart ? <ChainChart chains={chains} /> : null}

        <footer className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-amber-500/15 pt-6 text-center text-sm text-amber-100/55 sm:flex-row sm:text-left">
          <p>
            {roster.product.company} · {roster.product.wordmark} · {roster.product.market}
          </p>
          <p>Internal ops view · roster as of {metrics.asOfLabel}</p>
        </footer>
      </div>
    </div>
  );
}

function MarketHeader({ asOfLabel, subtitle }: { asOfLabel: string; subtitle: string }) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-[#17110c]/80 px-5 py-6 shadow-[0_0_80px_rgba(212,140,40,0.12)] sm:px-8 sm:py-8">
      <div className="string-lights mb-5" aria-hidden />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] tracking-[0.28em] text-amber-300/80 uppercase">
            Accra · street food · live ops
          </p>
          <div>
            <h1 className="font-display text-4xl leading-none text-amber-200 sm:text-6xl">
              Night Market
            </h1>
            <p className="mt-2 font-display text-2xl text-amber-50/90 italic sm:text-3xl">
              Vendors Live
            </p>
          </div>
          <p className="max-w-xl text-sm text-amber-100/70 sm:text-base">
            {subtitle} for Ghana food delivery. Two ops lanes, one roster — names
            exactly as submitted, counts computed from the lists.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-2xl border border-amber-400/25 bg-amber-950/40 px-4 py-3 text-amber-50 lg:items-end">
          <span className="text-[11px] tracking-[0.2em] text-amber-300/80 uppercase">
            As of
          </span>
          <span className="font-display text-2xl text-amber-200">{asOfLabel}</span>
          <span className="text-xs text-amber-100/60">Abonten Technologies</span>
        </div>
      </div>
    </header>
  );
}

function KpiRow({
  metrics,
}: {
  metrics: ReturnType<typeof computeMetrics>;
}) {
  const cards = [
    {
      label: "Roseline live",
      value: metrics.roselineLive,
      hint: "Taken live this roster",
    },
    {
      label: "Ibrahim brands",
      value: metrics.ibrahimSubmitted,
      hint: `${metrics.ibrahimUniqueBrands} unique after MaxMart de-dupe`,
    },
    {
      label: "Ibrahim chain locations",
      value: metrics.ibrahimChainLocations,
      hint: `${metrics.ibrahimChains} chains · branch spots`,
    },
    {
      label: "Overlaps",
      value: metrics.overlaps,
      hint: "Same chain branch, both lists",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="border-none bg-[#1b140f]/90 ring-amber-400/20"
        >
          <CardHeader className="gap-2">
            <CardTitle className="text-[11px] tracking-[0.18em] text-amber-300/80 uppercase">
              {card.label}
            </CardTitle>
            <p className="font-display text-5xl leading-none text-amber-100">
              {card.value}
            </p>
            <p className="text-xs text-amber-100/55">{card.hint}</p>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

function ContextStrip({
  disclaimer,
  week2,
  week3,
  combinedReviewed,
  combinedOnboarded,
  week2Rate,
  week3Rate,
}: {
  disclaimer: string;
  week2: { label: string; fullyOnboarded: number; reviewed: number };
  week3: { label: string; fullyOnboarded: number; reviewed: number };
  combinedReviewed: number;
  combinedOnboarded: number;
  week2Rate: number;
  week3Rate: number;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-400/25 bg-amber-950/20 px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-amber-400/15 text-amber-200">Context</Badge>
        <p className="text-xs text-amber-100/60">{disclaimer}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ContextStat
          label={`${week2.label} · Roseline`}
          value={`${week2.fullyOnboarded} of ${week2.reviewed}`}
          hint={`fully onboarded · ${formatPct(week2Rate)}`}
        />
        <ContextStat
          label={`${week3.label} · Roseline`}
          value={`${week3.fullyOnboarded} of ${week3.reviewed}`}
          hint={`fully onboarded · ${formatPct(week3Rate)}`}
        />
        <ContextStat
          label="Combined Aug weeks 2–3"
          value={`${combinedOnboarded} of ${combinedReviewed}`}
          hint="this roster is those 54 names"
        />
      </div>
    </section>
  );
}

function ContextStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-[#140f0b]/70 px-3 py-3">
      <p className="text-[11px] tracking-[0.16em] text-amber-300/70 uppercase">{label}</p>
      <p className="mt-1 font-display text-xl text-amber-50">{value}</p>
      <p className="text-xs text-amber-100/55">{hint}</p>
    </div>
  );
}

function OverlapAndDupNotes({
  overlaps,
  maxMartNote,
  uniqueBrands,
  singles,
}: {
  overlaps: { roselineName: string; ibrahimChain: string }[];
  maxMartNote: string;
  uniqueBrands: number;
  singles: number;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="border-none bg-[#1b140f]/90 ring-amber-400/15">
        <CardHeader>
          <CardTitle className="text-amber-100">Overlap — not double-credit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-100/75">
          <p>
            Roseline already took live these branches of Ibrahim&apos;s chains.
            They stay on both lists; they are not extra unique vendors live.
            Unique brands if those three are not double-credited: 54 + 24 − 3 = 75.
          </p>
          <ul className="space-y-1">
            {overlaps.map((row) => (
              <li key={row.roselineName} className="flex flex-wrap gap-x-2">
                <span className="text-amber-50">{row.roselineName}</span>
                <span className="text-amber-100/45">↔ {row.ibrahimChain}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-none bg-[#1b140f]/90 ring-amber-400/15">
        <CardHeader>
          <CardTitle className="text-amber-100">How Ibrahim is counted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-100/75">
          <p>{maxMartNote}</p>
          <p>
            Submitted rows stay at 25. Unique brand names: {uniqueBrands}.
            Singles with no branch count: {singles}. Chain branch spots sum to 80
            on the seven named chains.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VendorColumn({
  eyebrow,
  title,
  countLabel,
  meta,
  emptyLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  countLabel: string;
  meta?: string;
  emptyLabel: string;
  children: ReactNode;
}) {
  const isEmpty = Children.count(children) === 0;

  return (
    <section className="rounded-3xl border border-amber-400/15 bg-[#14100c]/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-amber-300/75 uppercase">{eyebrow}</p>
          <h2 className="font-display text-2xl text-amber-50">{title}</h2>
          {meta ? <p className="mt-1 text-xs text-amber-100/55">{meta}</p> : null}
        </div>
        <Badge className="bg-amber-400 text-[#1a1208]">{countLabel}</Badge>
      </div>
      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-amber-500/20 px-4 py-10 text-center text-sm text-amber-100/55">
          {emptyLabel}
        </p>
      ) : (
        <ol className="space-y-2">{children}</ol>
      )}
    </section>
  );
}

function RoselineRow({ vendor }: { vendor: RoselineVendor }) {
  return (
    <li className="stall-ticket flex items-start gap-3 rounded-xl bg-[#1c1510]/90 px-3 py-2.5 ring-1 ring-amber-400/10">
      <span className="font-display w-8 shrink-0 text-right text-lg text-amber-400/80">
        {String(vendor.stall).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-50">{vendor.name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {vendor.overlap ? (
            <Badge variant="outline" className="border-orange-400/40 text-orange-200">
              Overlap · {vendor.overlapChain}
            </Badge>
          ) : null}
          {vendor.tags.map((tag) => (
            <CuisineChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </li>
  );
}

function IbrahimRow({ brand }: { brand: IbrahimBrand }) {
  return (
    <li className="stall-ticket flex items-start gap-3 rounded-xl bg-[#1c1510]/90 px-3 py-2.5 ring-1 ring-amber-400/10">
      <span className="font-display w-8 shrink-0 text-right text-lg text-amber-400/80">
        {String(brand.stall).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-amber-50">{brand.name}</p>
          {brand.branches !== null ? (
            <span className="text-xs tracking-wide text-amber-300/80 uppercase">
              {brand.branches} branches
            </span>
          ) : (
            <span className="text-xs text-amber-100/40">single</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {brand.isDuplicateName ? (
            <Badge variant="outline" className="border-amber-400/40 text-amber-200">
              Same brand as earlier MaxMart row
            </Badge>
          ) : null}
          {brand.overlapLocations.map((loc) => (
            <Badge key={loc} variant="outline" className="border-orange-400/40 text-orange-200">
              Live on Roseline · {loc}
            </Badge>
          ))}
          {brand.tags.map((tag) => (
            <CuisineChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </li>
  );
}

function CuisineChip({ tag }: { tag: string }) {
  return (
    <Badge variant="secondary" className="bg-amber-400/10 text-amber-200/90">
      {tag}
    </Badge>
  );
}

function ChainChart({
  chains,
}: {
  chains: { name: string; branches: number; overlapLocations: string[] }[];
}) {
  const max = Math.max(...chains.map((row) => row.branches), 1);

  return (
    <section className="rounded-3xl border border-amber-400/15 bg-[#14100c]/80 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-amber-300/75 uppercase">
            Ibrahim · chain coverage
          </p>
          <h2 className="font-display text-2xl text-amber-50">
            Seven chains, 80 branch spots
          </h2>
        </div>
        <p className="text-xs text-amber-100/55">Horizontal bars by branch count</p>
      </div>
      <ul className="space-y-3">
        {chains.map((row) => (
          <li key={row.name} className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr_auto] sm:items-center sm:gap-3">
            <div>
              <p className="text-sm text-amber-50">{row.name}</p>
              {row.overlapLocations.length > 0 ? (
                <p className="text-[11px] text-orange-200/80">
                  Overlap: {row.overlapLocations.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-amber-950/80 ring-1 ring-amber-400/15">
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-600 to-amber-300"
                style={{ width: `${(row.branches / max) * 100}%` }}
              />
            </div>
            <span className="font-display text-lg text-amber-200">{row.branches}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
