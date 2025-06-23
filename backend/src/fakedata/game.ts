import type { CurrentGame } from "src/history/history";

export const fakeCurrentGame: CurrentGame = {
    map: "pl_borneo",
    players: [],
    rowid: 0,
    startTime: Date.now() - 900000,
    hostname: "Valve Matchmaking Server (Chicago srcds1020-ord1 #101)",
    ip: "169.254.116.201:5472",
    kills: 5,
    deaths: 2,
    demos: []
}

export const fakePlayers = [
    {
        name: "Grim Bloody Fable",
        userId: "105",
        ID3: "1127822620",
        ID64: "76561199088088348",
        alive: true,
        health: 125,
        ping: 33,
        team: 2,
        avatarHash: "a4b63f307e56cd23d448e0447f8e0c4e4f7db387",
        createdTimestamp: 1556925320,
        kills: 9,
        deaths: 0,
        class: 1,
        user: true,
        tags: {},
        note: ""
    },
    {
        name: "Screamin' Eagles",
        userId: "106",
        ID3: "10403381",
        ID64: "76561197970669109",
        alive: false,
        health: 0,
        ping: 161,
        team: 2,
        kills: 1,
        deaths: 5,
        tags: {},
        nickname: "Some Guy",
        note: ""
    },
    {
        name: "Still Alive",
        userId: "109",
        ID3: "97733808",
        ID64: "76561198057999536",
        alive: true,
        health: 166,
        ping: 39,
        team: 3,
        kills: 5,
        deaths: 2,
        tags: {},
        note: ""
    },
    {
        name: "Mentlegen",
        userId: "110",
        ID3: "83927554",
        ID64: "76561198044193282",
        alive: true,
        health: 356,
        ping: 7,
        team: 1,
        kills: 0,
        deaths: 0,
        tags: {},
        note: ""
    }
];

export const fakeKillfeed = [
    {
        killer: "Still Alive",
        victim: "Screamin' Eagles",
        killerTeam: 3,
        weapon: "tf_projectile_rocket",
        crit: true,
        killerId: "97733808",
        victimId: "10403381"
    },
    {
        killer: "Grim Bloody Fable",
        victim: "Still Alive",
        killerTeam: 2,
        weapon: "scattergun",
        crit: false,
        killerId: "1127822620",
        victimId: "97733808"
    }
]

export const fakeChat = [
    {
        name: "Still Alive",
        text: "I'm not even angry",
        senderTeam: 3,
        dead: true,
        team: false,
        senderId: "97733808"
    },
    {
        name: "Screamin' Eagles",
        text: "You are all weak. You are all bleeders!",
        senderTeam: 2,
        dead: false,
        team: true,
        senderId: "10403381"
    },
    {
        name: "Mentlegen",
        text: "Go to hell, and take your cheap suit with you!",
        senderTeam: 1,
        dead: false,
        team: false,
        senderId: "83927554"
    }
]