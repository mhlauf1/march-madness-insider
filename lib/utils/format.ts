export function formatRecord(wins: number | null, losses: number | null): string {
  if (wins === null || losses === null) return "—";
  return `${wins}-${losses}`;
}

export function formatEfficiency(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1);
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatRank(rank: number | null): string {
  if (rank === null) return "—";
  return `#${rank}`;
}

export function formatStatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

/** Format a decimal ratio (0.0–1.0) as a percentage, e.g. 0.543 → "54.3%" */
export function formatDecimalPct(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSignedNumber(value: number | null): string {
  if (value === null) return "—";
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}
