import type { KillfeedEntry, Lobby, Player } from "./lobby";

export enum GameMessages {
    Initial = "0",
    PlayerJoin = "1",
    PlayerLeave = "2",
    PlayerUpdate = "3",
    KillfeedAdded = "4"
}

export interface GameMessageTypes {
    [GameMessages.Initial]: Lobby;
    [GameMessages.PlayerJoin]: Player;
    [GameMessages.PlayerLeave]: string;
    [GameMessages.PlayerUpdate]: Partial<Player> & { userId: string };
    [GameMessages.KillfeedAdded]: KillfeedEntry;
}

export interface MessageTypes {
    game: GameMessageTypes;
}