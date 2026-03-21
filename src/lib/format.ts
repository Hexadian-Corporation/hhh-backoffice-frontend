export function formatDistance(meters: number): string {
  if (meters >= 1_000_000_000)
    return `${(meters / 1_000_000_000).toFixed(1)} Gm`;
  if (meters >= 1_000_000) return `${(meters / 1_000_000).toFixed(1)} Mm`;
  if (meters >= 1_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${meters.toFixed(0)} m`;
}
