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
            team: 2,
            avatarHash: "a4b63f307e56cd23d448e0447f8e0c4e4f7db387",
            createdTimestamp: 1556925320
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
    ],
    chat: [
        {
            name: "Still Alive",
            text: "I'm not even angry",
            senderTeam: 3,
            dead: true,
            team: false
        },
        {
            name: "Screamin' Eagles",
            text: "You are all weak. You are all bleeders!",
            senderTeam: 2,
            dead: false,
            team: true
        },
        {
            name: "Mentlegen",
            text: "Go to hell, and take your cheap suit with you!",
            senderTeam: 1,
            dead: false,
            team: false
        }
    ]
}