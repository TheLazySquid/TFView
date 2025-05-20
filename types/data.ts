export interface ConfigType {
    tf2Path: string;
    rconPort: number;
    rconPassword: string;
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

export interface PastGameEntry extends Omit<PastGame, "players"> {
    players: string;
}

export interface PlayerEncounter {
    chunk: number;
    indexFromEnd: number;
    name: string;
}

export interface PlayerInfo {
    encounters: PlayerEncounter[];
}

export interface HistoryType {
    pastGames: PastGame[];
}