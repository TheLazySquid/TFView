import type { HistoryType } from "$types/data";

export const fakeHistory: HistoryType = {
    pastGames: [
        // TODO: Better fake data
        {
            map: "pl_borneo",
            players: [],
            start: Date.now() - 1e9,
            duration: 1e6
        }
    ]
}