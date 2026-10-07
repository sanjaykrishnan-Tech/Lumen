// matches the real chart cards' height (title row + h-64 plot) so the page
// doesn't jump when the charts library finishes loading
export function ChartPlaceholder() {
  return <div aria-hidden className="h-[340px] animate-pulse rounded-lg border border-gray-200 bg-white" />
}
