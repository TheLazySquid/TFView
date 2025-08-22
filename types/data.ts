import type { PlayerSummary } from "./lobby";

export interface Tag {
    id: string;
    name: string;
    color?: string;
}

export interface CasualProfile {
    name: string;
    id: string;
    selection: number[];
}

export interface CasualConfig {
    profiles: CasualProfile[];
    selectedProfile: string;
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
    casual?: CasualConfig;
    launchTf2OnStart: boolean;
    openUiOnStart: boolean;
    pickedIfShortcut: boolean;
    finishedSetup: boolean;
}

export interface ValuesType {
    userSummary?: PlayerSummary;
    killCounts?: Record<string, [number, number]>;
    skippedVersion?: string;
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
    avatarHash?: string;
    gameId: number;
    time: number;
    kills: number;
    deaths: number;
}

export interface StoredPlayer {
    id: string;
    lastName: string;
    names: string[];
    avatars: string[];
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

export interface DemoHeader {
    demo_type: string;
    version: number;
    protocol: number;
    server: string;
    nick: string;
    map: string;
    game: "tf";
    duration: number;
    ticks: number;
    frames: number;
    signon: number;
}

export interface DemoChat {
    kind: string;
    from: string;
    text: string;
    tick: number;
}

export interface DemoUser {
    classes: Record<string, number>;
    name: string;
    userId: number;
    steamId: string;
    team: string;
}

interface DemoDeath {
    weapon: string;
    victim: number;
    assister: number | null;
    killer: number;
    tick: number;
}

export interface ParsedDemo {
    header: DemoHeader;
    chat: DemoChat[];
    users: Record<string, DemoUser>;
    deaths: DemoDeath[];
    rounds: any[];
    startTick: number;
    intervalPerTick: number;
    pauses: any[];
}