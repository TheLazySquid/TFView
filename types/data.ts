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
}

export interface PastGamePlayer {
    id: string;
    name: string;
    time: number;
}

export interface PastGame {
    start: number;
    duration: number;
    map: string;
    hostname?: string;
    ip?: string;
    players: PastGamePlayer[];
}

export interface PastGameEntry {
    start: number;
    duration: number;
    map: string;
    hostname?: string;
    ip?: string;
    rowid: number;
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
}