/** The collator that orders numbers inside text by value, so "V-2" comes before "V-10" */
const naturalCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

/** Compare two values as text in natural order, treating a missing value as empty */
export function naturalCompare(a, b) {
  return naturalCollator.compare(String(a ?? ""), String(b ?? ""));
}
