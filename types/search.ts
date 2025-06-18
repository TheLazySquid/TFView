export interface GameSearchParams {
    map?: string;
    hostname?: string;
    after?: number;
    before?: number;
}

export interface PlayerSearchParams {
    id?: string;   
    name?: string;
    tags?: string[];
    after?: number;
    before?: number;
}

export interface EncounterSearchParams {
    id: string;
    map?: string;
    name?: string;
    after?: number;
    before?: number;
}