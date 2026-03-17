import Image from "next/image";
import type { Team } from "@/lib/types";
import { formatRecord } from "@/lib/utils/format";

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  showSeed?: boolean;
  showRecord?: boolean;
  centered?: boolean;
}

const sizes = {
  sm: { logo: 20, text: "text-sm" },
  md: { logo: 28, text: "text-base" },
  lg: { logo: 40, text: "text-lg" },
};

export function TeamBadge({
  team,
  size = "md",
  showSeed = true,
  showRecord = false,
  centered = false,
}: TeamBadgeProps) {
  const s = sizes[size];

  if (centered) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {team.logo_url && (
          <Image
            src={team.logo_url}
            alt={team.name}
            width={s.logo}
            height={s.logo}
            className="shrink-0"
          />
        )}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {showSeed && (
            <span className="font-mono text-xs text-text-muted">
              ({team.seed})
            </span>
          )}
          <span className={`font-semibold ${s.text}`}>{team.name}</span>
        </div>
        {showRecord && team.record_wins != null && (
          <span className="text-xs text-text-muted">
            {formatRecord(team.record_wins, team.record_losses)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {team.logo_url && (
        <Image
          src={team.logo_url}
          alt={team.name}
          width={s.logo}
          height={s.logo}
          className="shrink-0"
        />
      )}
      <div className="flex items-center gap-1.5">
        {showSeed && (
          <span className="font-mono text-xs text-text-muted">
            ({team.seed})
          </span>
        )}
        <span className={`font-semibold ${s.text}`}>{team.name}</span>
        {showRecord && team.record_wins != null && (
          <span className="text-xs text-text-muted">
            {formatRecord(team.record_wins, team.record_losses)}
          </span>
        )}
      </div>
    </div>
  );
}
