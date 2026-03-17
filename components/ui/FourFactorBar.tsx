interface FourFactorBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  average: number;
  higherIsBetter: boolean;
}

export function FourFactorBar({
  label,
  value,
  min,
  max,
  average,
  higherIsBetter,
}: FourFactorBarProps) {
  const range = max - min;
  const valuePct = Math.min(Math.max(((value - min) / range) * 100, 0), 100);
  const avgPct = Math.min(Math.max(((average - min) / range) * 100, 0), 100);

  const barLeft = Math.min(valuePct, avgPct);
  const barWidth = Math.abs(valuePct - avgPct);

  const isGood = higherIsBetter ? value >= average : value <= average;
  const barColor = isGood ? "bg-accent-green" : "bg-accent-red";
  const textColor = value === average
    ? "text-text-secondary"
    : isGood
      ? "text-accent-green"
      : "text-accent-red";

  return (
    <div className="flex items-center gap-3">
      <span className="stat-label w-10 shrink-0 text-xs">{label}</span>
      <div className="relative h-[10px] flex-1 rounded-sm bg-bg-elevated">
        {/* Diverging bar: extends from average line toward value */}
        {barWidth > 0 && (
          <div
            className={`absolute top-0 h-full rounded-sm transition-all ${barColor}`}
            style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
          />
        )}
        {/* D1 average center line */}
        <div
          className="absolute top-[-3px] h-[16px] w-[2px] rounded-sm bg-text-secondary"
          style={{ left: `${avgPct}%`, transform: "translateX(-1px)" }}
          title={`D1 Avg: ${average}`}
        />
      </div>
      <span className={`w-12 text-right font-mono text-xs ${textColor}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
