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
    // From status command
    connectTime?: number;
    
    // From g15_dumpplayer command
    name: string;
    /** 1 spectator, 2 = red, 3 = blue */
    team: number;
    ping: number;
    health: number;
    alive: boolean;
    userId: string;
    accountId: string;

    // TODO: Killfeed related things
}

export interface Lobby {
    players: Player[];
}