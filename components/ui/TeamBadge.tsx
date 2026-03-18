import Image from "next/image";
import Link from "next/link";
import type { Team } from "@/lib/types";
import { formatRecord } from "@/lib/utils/format";

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  showSeed?: boolean;
  showRecord?: boolean;
  centered?: boolean;
  linkToTeam?: boolean;
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
  linkToTeam = false,
}: TeamBadgeProps) {
  const s = sizes[size];

  const Wrapper = linkToTeam && team.slug
    ? ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <Link href={`/teams/${team.slug}`} className={`${className ?? ""} transition-opacity hover:opacity-75`}>
          {children}
        </Link>
      )
    : ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
      );

  if (centered) {
    return (
      <Wrapper className="flex flex-col items-center gap-1.5">
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
      </Wrapper>
    );
  }

  return (
    <Wrapper className="flex items-center gap-2">
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
    </Wrapper>
  );
}
