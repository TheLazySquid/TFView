import type { Lobby } from "$types/lobby";

export const fakeLobby: Lobby = {
    players: [
        {
            name: "Grim Bloody Fable",
            userId: "105",
            accountId: "7618970238",
            alive: true,
            health: 125,
            ping: 33,
            team: 2
        },
        {
            name: "Screamin' Eagles",
            userId: "106",
            accountId: "7618970252",
            alive: false,
            health: 0,
            ping: 161,
            team: 2
        },
        {
            name: "Still Alive",
            userId: "109",
            accountId: "761897686",
            alive: true,
            health: 166,
            ping: 39,
            team: 3
        },
        {
            name: "Mentlegen",
            userId: "110",
            accountId: "761897689",
            alive: true,
            health: 356,
            ping: 7,
            team: 1
        }
    ],
    killfeed: [
        {
            killer: "Still Alive",
            victim: "Screamin' Eagles",
            killerTeam: 3,
            weapon: "tf_projectile_rocket",
            crit: true
        },
        {
            killer: "Grim Bloody Fable",
            victim: "Still Alive",
            killerTeam: 2,
            weapon: "scattergun",
            crit: false
        }
    ]
}