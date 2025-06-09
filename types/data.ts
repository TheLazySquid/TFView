export interface SettingsType {
    steamPath: string;
    tfPath: string;
    rconPort: number;
    rconPassword: string;
    steamApiKey?: string;
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
    players: PastGamePlayer[];
}

export interface PastGameEntry {
    start: number;
    duration: number;
    map: string;
    rowid: number;
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