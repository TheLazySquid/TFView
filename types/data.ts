export interface Tag {
    id: string;
    name: string;
    color?: string;
}

export interface SettingsType {
    steamPath: string;
    tfPath: string;
    rconPort: number;
    rconPassword: string;
    steamApiKey?: string;
    tags: Tag[];
    userColor?: string;
    masterbaseKey?: string;
}

export interface PastGamePlayer {
    id: string;
    name: string;
    time: number;
    kills: number;
    deaths: number;
}

// What's stored in the database
export interface PastGame {
    start: number;
    duration: number;
    map: string;
    hostname?: string;
    ip?: string;
    players: PastGamePlayer[];
    kills: number;
    deaths: number;
    demos?: string[];
}

// What's sent to the client to be displayed on /history
export interface PastGameEntry {
    rowid: number;
    start: number;
    duration: number;
    map: string;
    hostname?: string;
    ip?: string;
    kills: number;
    deaths: number;
}

export interface CurrentGame {
    start: number;
    map: string;
    hostname?: string;
    ip?: string;
}

export type Stored<T> = {
    [K in keyof T]: T[K] extends (string | number | boolean | null) ? T[K] : string;
}

export interface PlayerEncounter {
    playerId: string;
    map: string;
    name: string;
    gameId: number;
    time: number;
    kills: number;
    deaths: number;
}

export interface StoredPlayer {
    id: string;
    lastName: string;
    lastSeen: number;
    avatarHash?: string;
    tags?: string;
    nickname?: string;
    note?: string;
}