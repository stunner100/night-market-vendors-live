const CUISINE_RULES: { tag: string; test: (name: string) => boolean }[] = [
  { tag: "waakye", test: (n) => n.includes("waakye") },
  { tag: "pizza", test: (n) => n.includes("pizza") },
  { tag: "shawarma", test: (n) => n.includes("shawarma") },
  { tag: "breakfast", test: (n) => n.includes("breakfast") },
  { tag: "kenkey", test: (n) => n.includes("kenkey") },
  { tag: "chicken", test: (n) => n.includes("chicken") },
];

/** Infer cuisine tags only when the name itself makes it obvious. Never guess. */
export function inferCuisineTags(name: string): string[] {
  const lower = name.toLowerCase();
  return CUISINE_RULES.filter((rule) => rule.test(lower)).map((rule) => rule.tag);
}
