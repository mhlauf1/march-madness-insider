"use client";

import { useState } from "react";
import type { Team, Game } from "@/lib/types";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { getRoundName } from "@/lib/utils/bracket";
import { getWinProbability } from "@/lib/utils/probability";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePicks } from "@/lib/hooks/usePicks";
import { getNextGame, getNextGameSlot } from "@/lib/utils/bracket-structure";
import { MatchupSheet } from "@/components/bracket/MatchupSheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { Check, Info, X } from "lucide-react";

interface BracketViewProps {
  games: Game[];
}

const ROUNDS = [0, 1, 2, 3, 4, 5, 6];
const ROUND_SHORT: Record<number, string> = {
  0: "FF",
  1: "R64",
  2: "R32",
  3: "S16",
  4: "E8",
  5: "F4",
  6: "NCG",
};

const LEFT_REGIONS = ["East", "Midwest"];
const RIGHT_REGIONS = ["West", "South"];

// Traditional bracket order: the top seed of each R64 matchup in display order
const BRACKET_SEED_ORDER = [1, 8, 5, 4, 6, 3, 7, 2];

function getBracketPosition(game: Game): number {
  // R64: order by traditional bracket seed matchup
  if (game.round === 1) {
    const topSeed = Math.min(game.team1?.seed ?? 99, game.team2?.seed ?? 99);
    const idx = BRACKET_SEED_ORDER.indexOf(topSeed);
    return idx >= 0 ? idx : 99;
  }
  // R32+: order by game_number (assigned to match bracket math)
  return game.game_number ?? 99;
}

/**
 * Build a map of projected teams: for games without assigned teams,
 * determine which team would appear based on the user's picks.
 */
function buildProjectedTeams(
  games: Game[],
  picks: Map<string, string>,
): Map<string, { team1?: Team; team2?: Team }> {
  const projections = new Map<string, { team1?: Team; team2?: Team }>();

  // Build a team lookup from all games
  const teamLookup = new Map<string, Team>();
  for (const g of games) {
    if (g.team1) teamLookup.set(g.team1.id, g.team1);
    if (g.team2) teamLookup.set(g.team2.id, g.team2);
  }

  // Process games round by round
  const sortedGames = [...games].sort((a, b) => a.round - b.round);

  for (const game of sortedGames) {
    const pickedTeamId = picks.get(game.id);
    if (!pickedTeamId) continue;

    const pickedTeam = teamLookup.get(pickedTeamId);
    if (!pickedTeam) continue;

    // Find the next game this winner feeds into
    const nextGame = getNextGame(game, games);
    if (!nextGame) continue;

    const slot = getNextGameSlot(game);
    const existing = projections.get(nextGame.id) ?? {};

    if (slot === "team1") {
      existing.team1 = pickedTeam;
    } else {
      existing.team2 = pickedTeam;
    }

    projections.set(nextGame.id, existing);
  }

  return projections;
}

/* ------------------------------------------------------------------ */
/*  GameCard                                                            */
/* ------------------------------------------------------------------ */

// Treat placeholder teams (seed 99 or name "TBD") as absent
const isTBD = (team?: Team | null) =>
  !team || team.name === "TBD" || team.seed === 99;

function GameCard({
  game,
  pickedTeamId,
  projectedTeams,
  onPickTeam,
  onViewDetails,
}: {
  game: Game;
  pickedTeamId: string | null;
  projectedTeams?: { team1?: Team; team2?: Team };
  onPickTeam: (game: Game, teamId: string) => void;
  onViewDetails: (game: Game, displayedTeams?: { team1?: Team; team2?: Team }) => void;
}) {
  const isComplete = game.is_completed;
  const isUpset = game.is_upset;
  const isPicked = !!pickedTeamId;

  // Determine displayed teams (real or projected)
  const displayTeam1 = isTBD(game.team1) ? projectedTeams?.team1 : game.team1;
  const displayTeam2 = isTBD(game.team2) ? projectedTeams?.team2 : game.team2;
  const isTeam1Projected = isTBD(game.team1) && !!projectedTeams?.team1;
  const isTeam2Projected = isTBD(game.team2) && !!projectedTeams?.team2;

  const hasRealTeams = !isTBD(game.team1) && !isTBD(game.team2);
  const hasBothTeams = !!displayTeam1 && !!displayTeam2;
  const canPick = (hasRealTeams || hasBothTeams) && !isComplete;

  const borderClass = isPicked
    ? "border-accent-green"
    : isUpset
      ? "border-accent-amber/50"
      : "border-border-subtle";

  function handleTeamClick(teamId: string) {
    if (!canPick) return;
    onPickTeam(game, teamId);
  }

  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-md)] border ${borderClass} bg-bg-surface transition-colors`}
    >
      {/* Team 1 row */}
      <div
        onClick={() =>
          displayTeam1 && handleTeamClick(displayTeam1.id)
        }
        className={`flex min-h-[44px] items-center justify-between gap-2 px-2.5 py-2 ${
          pickedTeamId === displayTeam1?.id ? "bg-accent-green/10" : ""
        } ${
          canPick && displayTeam1
            ? "cursor-pointer hover:bg-accent-blue/5"
            : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          {displayTeam1 ? (
            <div
              className={`flex items-center gap-1.5 ${isTeam1Projected ? "opacity-75" : ""}`}
            >
              <TeamBadge team={displayTeam1} size="sm" />
            </div>
          ) : (
            <span className="text-xs text-text-muted">TBD</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {pickedTeamId === displayTeam1?.id && (
            <Check size={16} className="text-accent-green" strokeWidth={3} />
          )}
          {isComplete && game.team1_score != null && (
            <span
              className={`shrink-0 font-mono text-sm font-bold ${
                game.winner_id === game.team1_id
                  ? "text-accent-blue"
                  : "text-text-muted"
              }`}
            >
              {game.team1_score}
            </span>
          )}
        </div>
      </div>

      {/* Divider with info button */}
      <div className="flex items-center gap-1 px-2.5">
        <div className="flex-1 border-t border-border-subtle" />
        {hasBothTeams && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(game, { team1: displayTeam1 ?? undefined, team2: displayTeam2 ?? undefined });
            }}
            className="shrink-0 cursor-pointer rounded p-0.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
            aria-label="View matchup details"
          >
            <Info size={16} />
          </button>
        )}
        <div className="flex-1 border-t border-border-subtle" />
      </div>

      {/* Team 2 row */}
      <div
        onClick={() =>
          displayTeam2 && handleTeamClick(displayTeam2.id)
        }
        className={`flex min-h-[44px] items-center justify-between gap-2 px-2.5 py-2 ${
          pickedTeamId === displayTeam2?.id ? "bg-accent-green/10" : ""
        } ${
          canPick && displayTeam2
            ? "cursor-pointer hover:bg-accent-blue/5"
            : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          {displayTeam2 ? (
            <div
              className={`flex items-center gap-1.5 ${isTeam2Projected ? "opacity-75" : ""}`}
            >
              <TeamBadge team={displayTeam2} size="sm" />
            </div>
          ) : (
            <span className="text-xs text-text-muted">TBD</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {pickedTeamId === displayTeam2?.id && (
            <Check size={16} className="text-accent-green" strokeWidth={3} />
          )}
          {isComplete && game.team2_score != null && (
            <span
              className={`shrink-0 font-mono text-sm font-bold ${
                game.winner_id === game.team2_id
                  ? "text-accent-blue"
                  : "text-text-muted"
              }`}
            >
              {game.team2_score}
            </span>
          )}
        </div>
      </div>

      {/* Upset badge */}
      {isUpset && (
        <div className="pb-1.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-amber">
            Upset
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Bracket Region Column                                      */
/* ------------------------------------------------------------------ */

function RegionColumn({
  games,
  round,
  region,
  picks,
  projections,
  onPickTeam,
  onViewDetails,
}: {
  games: Game[];
  round: number;
  region: string;
  picks: Map<string, string>;
  projections: Map<string, { team1?: Team; team2?: Team }>;
  onPickTeam: (game: Game, teamId: string) => void;
  onViewDetails: (game: Game, displayedTeams?: { team1?: Team; team2?: Team }) => void;
}) {
  const filtered = games
    .filter((g) => g.round === round && g.region === region)
    .sort((a, b) => getBracketPosition(a) - getBracketPosition(b));

  return (
    <div className="flex flex-col justify-around gap-2">
      {filtered.length > 0 ? (
        filtered.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            pickedTeamId={picks.get(game.id) ?? null}
            projectedTeams={projections.get(game.id)}
            onPickTeam={onPickTeam}
            onViewDetails={onViewDetails}
          />
        ))
      ) : (
        <div className="h-16 rounded-[var(--radius-md)] border border-dashed border-border-subtle" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Bracket View                                               */
/* ------------------------------------------------------------------ */

function DesktopBracket({
  games,
  picks,
  projections,
  onPickTeam,
  onViewDetails,
}: {
  games: Game[];
  picks: Map<string, string>;
  projections: Map<string, { team1?: Team; team2?: Team }>;
  onPickTeam: (game: Game, teamId: string) => void;
  onViewDetails: (game: Game, displayedTeams?: { team1?: Team; team2?: Team }) => void;
}) {
  const finalFourGames = games.filter((g) => g.round === 5);
  const championshipGames = games.filter((g) => g.round === 6);
  const firstFourGames = games.filter((g) => g.round === 0);

  return (
    <div className="flex flex-col gap-6">
      {/* First Four row */}
      {firstFourGames.length > 0 && (
        <div>
          <h3 className="section-header mb-3">First Four</h3>
          <div className="grid grid-cols-4 gap-3">
            {firstFourGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                pickedTeamId={picks.get(game.id) ?? null}
                projectedTeams={projections.get(game.id)}
                onPickTeam={onPickTeam}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main bracket grid */}
      <div
        className="grid gap-x-2"
        style={{
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(140px, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
        }}
      >
        {/* Column headers */}
        {["R64", "R32", "S16", "E8", "F4 / NCG", "E8", "S16", "R32", "R64"].map(
          (label, i) => (
            <div
              key={i}
              className="pb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-text-muted"
            >
              {label}
            </div>
          ),
        )}

        {/* --- Top half: East (left) / West (right) --- */}
        {[1, 2, 3, 4].map((round) => (
          <RegionColumn
            key={`east-${round}`}
            games={games}
            round={round}
            region="East"
            picks={picks}
            projections={projections}
            onPickTeam={onPickTeam}
            onViewDetails={onViewDetails}
          />
        ))}

        {/* Center column spanning both halves */}
        <div className="row-span-2 flex flex-col items-stretch justify-center gap-3">
          {finalFourGames.length > 0 ? (
            finalFourGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                pickedTeamId={picks.get(game.id) ?? null}
                projectedTeams={projections.get(game.id)}
                onPickTeam={onPickTeam}
                onViewDetails={onViewDetails}
              />
            ))
          ) : (
            <>
              <div className="h-16 rounded-[var(--radius-md)] border border-dashed border-border-subtle" />
              <div className="h-16 rounded-[var(--radius-md)] border border-dashed border-border-subtle" />
            </>
          )}

          <div className="my-2 border-t border-accent-blue/30" />
          {championshipGames.length > 0 ? (
            championshipGames.map((game) => (
              <div
                key={game.id}
                className="rounded-[var(--radius-md)] border border-accent-blue/40 bg-bg-elevated p-1"
              >
                <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-accent-blue">
                  Championship
                </div>
                <GameCard
                  game={game}
                  pickedTeamId={picks.get(game.id) ?? null}
                  projectedTeams={projections.get(game.id)}
                  onPickTeam={onPickTeam}
                  onViewDetails={onViewDetails}
                />
              </div>
            ))
          ) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-accent-blue/30 p-4 text-center text-xs text-text-muted">
              NCG
            </div>
          )}
        </div>

        {/* Right rounds 4-1 for West */}
        {[4, 3, 2, 1].map((round) => (
          <RegionColumn
            key={`west-${round}`}
            games={games}
            round={round}
            region="West"
            picks={picks}
            projections={projections}
            onPickTeam={onPickTeam}
            onViewDetails={onViewDetails}
          />
        ))}

        {/* --- Bottom half: Midwest (left) / South (right) --- */}
        {[1, 2, 3, 4].map((round) => (
          <RegionColumn
            key={`midwest-${round}`}
            games={games}
            round={round}
            region="Midwest"
            picks={picks}
            projections={projections}
            onPickTeam={onPickTeam}
            onViewDetails={onViewDetails}
          />
        ))}

        {[4, 3, 2, 1].map((round) => (
          <RegionColumn
            key={`south-${round}`}
            games={games}
            round={round}
            region="South"
            picks={picks}
            projections={projections}
            onPickTeam={onPickTeam}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Rounds View                                                 */
/* ------------------------------------------------------------------ */

function MobileRounds({
  games,
  picks,
  projections,
  onPickTeam,
  onViewDetails,
}: {
  games: Game[];
  picks: Map<string, string>;
  projections: Map<string, { team1?: Team; team2?: Team }>;
  onPickTeam: (game: Game, teamId: string) => void;
  onViewDetails: (game: Game, displayedTeams?: { team1?: Team; team2?: Team }) => void;
}) {
  const [activeRound, setActiveRound] = useState<number>(() => {
    const incomplete = games.filter((g) => !g.is_completed);
    if (incomplete.length === 0) return 6;
    return Math.min(...incomplete.map((g) => g.round));
  });

  const roundGames = games.filter((g) => g.round === activeRound);

  const regions = ["East", "West", "Midwest", "South"];
  const groupedByRegion =
    activeRound >= 1 && activeRound <= 4
      ? regions
          .map((region) => ({
            region,
            games: roundGames.filter((g) => g.region === region),
          }))
          .filter((group) => group.games.length > 0)
      : null;

  return (
    <div>
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-2">
        {ROUNDS.map((round) => {
          const count = games.filter((g) => g.round === round).length;
          if (count === 0) return null;
          return (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeRound === round
                  ? "bg-accent-blue text-white"
                  : "bg-bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              {ROUND_SHORT[round]}
              <span className="ml-1 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <h2 className="section-header mb-4">{getRoundName(activeRound)}</h2>

      {groupedByRegion ? (
        groupedByRegion.map((group) => (
          <div key={group.region} className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {group.region} Region
            </h3>
            <div className="flex flex-col gap-2.5">
              {group.games
                .sort((a, b) => getBracketPosition(a) - getBracketPosition(b))
                .map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    pickedTeamId={picks.get(game.id) ?? null}
                    projectedTeams={projections.get(game.id)}
                    onPickTeam={onPickTeam}
                    onViewDetails={onViewDetails}
                  />
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col gap-2.5">
          {roundGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              pickedTeamId={picks.get(game.id) ?? null}
              projectedTeams={projections.get(game.id)}
              onPickTeam={onPickTeam}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {roundGames.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">
          No games scheduled for this round yet.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main BracketView                                                   */
/* ------------------------------------------------------------------ */

export function BracketView({ games }: BracketViewProps) {
  const [view, setView] = useState<"bracket" | "rounds">("bracket");
  const [sheetGame, setSheetGame] = useState<Game | null>(null);
  const [sheetProjectedTeams, setSheetProjectedTeams] = useState<{ team1?: Team; team2?: Team } | undefined>(undefined);
  const [showAuthBanner, setShowAuthBanner] = useState(false);
  const [authBannerDismissed, setAuthBannerDismissed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const {
    picks,
    pickGame,
    clearPicks,
    loading: picksLoading,
    progress,
    totalGames,
  } = usePicks(user, games);

  const projections =
    picks.size > 0 ? buildProjectedTeams(games, picks) : new Map();

  function handlePickTeam(game: Game, teamId: string) {
    pickGame(game, teamId);
    // Show auth banner on first anonymous pick (once per session)
    if (!user && !authBannerDismissed && !showAuthBanner) {
      setShowAuthBanner(true);
    }
  }

  function handleViewDetails(game: Game, displayedTeams?: { team1?: Team; team2?: Team }) {
    setSheetGame(game);
    setSheetProjectedTeams(displayedTeams);
  }

  return (
    <div>
      {/* Auth banner for anonymous users */}
      {showAuthBanner && !authBannerDismissed && !user && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-accent-blue/30 bg-accent-blue/5 px-4 py-3">
          <p className="text-sm text-text-secondary">
            Sign in to save your picks across devices
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-[var(--radius-sm)] bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-blue/90"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setShowAuthBanner(false);
                setAuthBannerDismissed(true);
              }}
              className="rounded p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* View toggle (desktop only) */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <button
            onClick={() => setView("bracket")}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === "bracket"
                ? "bg-accent-blue text-white"
                : "bg-bg-surface text-text-muted hover:text-text-secondary"
            }`}
          >
            Bracket
          </button>
          <button
            onClick={() => setView("rounds")}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === "rounds"
                ? "bg-accent-blue text-white"
                : "bg-bg-surface text-text-muted hover:text-text-secondary"
            }`}
          >
            By Round
          </button>
        </div>

        {/* Progress bar + Clear All (shown when picks exist) */}
        {picks.size > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{
                    width:
                      totalGames > 0
                        ? `${(progress / totalGames) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-text-muted">
                {progress}/{totalGames}
              </span>
            </div>

            <button
              onClick={clearPicks}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] text-accent-red transition-colors hover:bg-accent-red/10"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block">
        {view === "bracket" ? (
          <DesktopBracket
            games={games}
            picks={picks}
            projections={projections}
            onPickTeam={handlePickTeam}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <MobileRounds
            games={games}
            picks={picks}
            projections={projections}
            onPickTeam={handlePickTeam}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      {/* Mobile view - always shows rounds */}
      <div className="lg:hidden">
        <MobileRounds
          games={games}
          picks={picks}
          projections={projections}
          onPickTeam={handlePickTeam}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Matchup Sheet */}
      {sheetGame && (
        <MatchupSheet
          game={sheetGame}
          currentPick={picks.get(sheetGame.id) ?? null}
          projectedTeam1={sheetProjectedTeams?.team1}
          projectedTeam2={sheetProjectedTeams?.team2}
          onClose={() => { setSheetGame(null); setSheetProjectedTeams(undefined); }}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
