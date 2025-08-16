export const enum TF2Class {
    Scout,
    Soldier,
    Pyro,
    Demo,
    Heavy,
    Engineer,
    Medic,
    Sniper,
    Spy
}

export interface G15Player {
    iAmmo: string;
    szName: string;
    iPing: string;
    iScore: string;
    iDeaths: string;
    bConnected: string;
    iTeam: string;
    bAlive: string;
    iHealth: string;
    iAccountID: string;
    bValid: string;
    iUserID: string;
}

export interface Player {    
    // From steam api
    avatarHash?: string;
    createdTimestamp?: number;

    // From status command
    connectTime?: number;
    
    // From g15_dumpplayer command
    name: string;
    /** 1 = spectator, 2 = red, 3 = blue */
    team: number;
    ping: number;
    health: number;
    alive: boolean;
    userId: string;
    ID3: string;
    ID64: string;
    kills: number;
    deaths: number;

    // From killfeed
    killstreak: number;

    // Estimated based on killfeed and health
    maxHealth?: number;
    class?: TF2Class;

    // Gotten from loginusers.vdf
    user?: boolean;

    // From history
    names: string[];
    encounters?: number;

    // user-generated
    tags: Record<string, boolean>;
    nickname?: string | null;
    note: string;
}

export interface ListEvent {
    type: "event";
    text: string;
}

export interface KillfeedKill {
    // Can be left blank to save a few bytes, assumed to be the default
    type?: "kill";
    killer: string;
    victim: string;
    weapon: string;
    crit: boolean;
    killerTeam: number;
    killerId: string;
    victimId: string;
    timestamp: number;
}

export type KillfeedEntry = KillfeedKill | ListEvent;

export interface ChatMessage {
    type?: "message";
    name: string;
    text: string;
    senderTeam: number;
    team: boolean;
    dead: boolean;
    senderId: string;
    timestamp: number;
}

export type ChatEntry = ChatMessage | ListEvent;

export interface CurrentServerInfo {
    start: number;
    map: string;
    hostname: string;
    ip: string;
}

export interface PlayerSummary {
    avatarHash: string;
    createdTimestamp: number;
    name?: string;
}

export type KickReason = "cheating" | "idle" | "scamming" | "other";