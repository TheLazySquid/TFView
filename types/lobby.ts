export interface Player {    
    // From status command
    connectTime?: number;
    
    // From g15_dumpplayer command
    name: string;
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