"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserPicks, upsertPick, deletePicksByGameIds, deleteAllPicks } from "@/lib/queries/picks";
import { getDownstreamGameIds } from "@/lib/utils/bracket-structure";
import type { Game } from "@/lib/types";

const LOCAL_STORAGE_KEY = "bracketlab-draft-picks";

function readLocalPicks(): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function writeLocalPicks(picks: Map<string, string>) {
  if (typeof window === "undefined") return;
  const obj = Object.fromEntries(picks);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
}

function clearLocalPicks() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function usePicks(user: User | null, allGames: Game[]) {
  const [picks, setPicks] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);

  const totalGames = allGames.length;

  const progress = picks.size;

  // Load picks: from Supabase if logged in, from localStorage if anonymous
  useEffect(() => {
    if (!user) {
      // Anonymous: load from localStorage
      setPicks(readLocalPicks());
      syncedRef.current = false;
      return;
    }

    // Authenticated: load from Supabase
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    getUserPicks(supabase, user.id)
      .then((userPicks) => {
        const map = new Map<string, string>();
        for (const p of userPicks) {
          map.set(p.game_id, p.picked_team_id);
        }
        setPicks(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Sync localStorage drafts to Supabase when user transitions null → non-null
  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;

    const localPicks = readLocalPicks();
    if (localPicks.size === 0) return;

    const supabase = getSupabaseBrowserClient();
    const gameMap = new Map(allGames.map((g) => [g.id, g]));

    (async () => {
      for (const [gameId, teamId] of localPicks) {
        const game = gameMap.get(gameId);
        if (!game) continue;
        try {
          await upsertPick(supabase, {
            user_id: user.id,
            game_id: gameId,
            picked_team_id: teamId,
            round: game.round,
            region: game.region,
          });
        } catch (err) {
          // silently skip failed sync
        }
      }
      clearLocalPicks();

      // Reload from Supabase to get the merged state
      const userPicks = await getUserPicks(supabase, user.id);
      const map = new Map<string, string>();
      for (const p of userPicks) {
        map.set(p.game_id, p.picked_team_id);
      }
      setPicks(map);
    })();
  }, [user, allGames]);

  const pickGame = useCallback(
    async (game: Game, pickedTeamId: string) => {
      const oldPickedTeamId = picks.get(game.id);

      // If changing a pick, delete downstream picks that relied on the old team
      if (oldPickedTeamId && oldPickedTeamId !== pickedTeamId) {
        const downstreamIds = getDownstreamGameIds(game, allGames);
        const toDelete = downstreamIds.filter((gid) => picks.has(gid));

        if (toDelete.length > 0) {
          if (user) {
            const supabase = getSupabaseBrowserClient();
            await deletePicksByGameIds(supabase, user.id, toDelete);
          }
          setPicks((prev) => {
            const next = new Map(prev);
            for (const gid of toDelete) {
              next.delete(gid);
            }
            // Also set the new pick
            next.set(game.id, pickedTeamId);
            if (!user) writeLocalPicks(next);
            return next;
          });
          // Upsert the pick to Supabase if authenticated
          if (user) {
            const supabase = getSupabaseBrowserClient();
            await upsertPick(supabase, {
              user_id: user.id,
              game_id: game.id,
              picked_team_id: pickedTeamId,
              round: game.round,
              region: game.region,
            });
          }
          return;
        }
      }

      // Upsert the pick
      if (user) {
        const supabase = getSupabaseBrowserClient();
        await upsertPick(supabase, {
          user_id: user.id,
          game_id: game.id,
          picked_team_id: pickedTeamId,
          round: game.round,
          region: game.region,
        });
      }

      setPicks((prev) => {
        const next = new Map(prev);
        next.set(game.id, pickedTeamId);
        if (!user) writeLocalPicks(next);
        return next;
      });
    },
    [user, picks, allGames],
  );

  const clearPicks = useCallback(async () => {
    if (user) {
      const supabase = getSupabaseBrowserClient();
      await deleteAllPicks(supabase, user.id);
    } else {
      clearLocalPicks();
    }
    setPicks(new Map());
  }, [user]);

  return { picks, pickGame, clearPicks, loading, progress, totalGames };
}
