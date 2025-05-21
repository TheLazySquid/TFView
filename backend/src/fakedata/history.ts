import type { PastGame, PastGameEntry } from "$types/data";

export const fakePastGames: (PastGame & PastGameEntry)[] = [
    {
        map: "pl_borneo",
        players: [],
        start: Date.now() - 1e9,
        duration: 1e62,
        rowid: 1
    }
]