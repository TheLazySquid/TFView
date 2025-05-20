export interface ConfigType {
    tf2Path: string;
    rconPort: number;
    rconPassword: string;
}

export interface PastGamePlayer {
    id: string;
    name: string;
}

export interface PastGame {
    start: number;
    duration: number;
    map: string;
    players: PastGamePlayer[];
}

export interface HistoryType {
    pastGames: PastGame[];
}