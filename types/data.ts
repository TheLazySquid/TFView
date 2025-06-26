import type { PlayerSummary } from "./lobby";

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
    userColor: string;
    masterbaseKey?: string;
    userSummary?: PlayerSummary;
}

export type GameDir = "steam" | "tf";

export interface GameDirInfo {
    path: string;
    valid: boolean;
}

export interface GameDirectories {
    steam: GameDirInfo;
    tf: GameDirInfo;
}

export interface PastGamePlayer {
    id: string;
    name: string;
    time: number;
    kills: number;
    deaths: number;
}

// What's stored in the database
export interface StoredPastGame {
    start: number;
    duration: number;
    map: string;
    hostname?: string;
    ip?: string;
    players: PastGamePlayer[];
    kills: number;
    deaths: number;
    demos?: string[];
    rowid: number;
}

// What's sent to the client to be displayed on /history
export type PastGame = Omit<StoredPastGame, 'players'>;

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
    names: string[];
    lastSeen: number;
    encounters: number;
    avatarHash?: string;
    createdTimestamp?: number;
    tags?: string[];
    nickname?: string;
    note?: string;
}

export type PastPlayer = Omit<StoredPlayer, 'tags'> & {
    tags: Record<string, boolean>;
}