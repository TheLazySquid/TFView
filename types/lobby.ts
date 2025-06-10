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
    accountId: string;

    // From killfeed parser
    kills: number;
    deaths: number;

    // Estimated based on killfeed and health
    class?: TF2Class;

    // Gotten from loginusers.vdf
    user?: boolean;
}

export interface KillfeedEntry {
    killer: string;
    victim: string;
    weapon: string;
    crit: boolean;
    killerTeam: number;
    killerId: string;
    victimId: string;
}

export interface ChatMessage {
    name: string;
    text: string;
    senderTeam: number;
    team: boolean;
    dead: boolean;
    senderId: string;
}

export interface Lobby {
    players: Player[];
    killfeed: KillfeedEntry[];
    chat: ChatMessage[];
}

export interface PlayerSummary {
    avatarHash: string;
    createdTimestamp: number;
}