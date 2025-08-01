export interface GameSearchParams {
    map?: string;
    hostname?: string;
    after?: number;
    before?: number;
}

export interface PlayerSearchParams {
    name?: string;
    id64?: string;
    id3?: string;
    tags: string[];
    after?: number;
    before?: number;
    sortBy: 'encounters' | 'lastSeen';
}

export interface EncounterSearchParams {
    id: string;
    map?: string;
    name?: string;
    after?: number;
    before?: number;
}

export type KillfeedEntryType = "all" | "kill" | "death";

export interface KillfeedSearchParams {
    id?: string;
    type: KillfeedEntryType;
}

export interface ChatSearchParams {
    id?: string;
}