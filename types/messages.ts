import type { Player } from "./lobby";

export enum GameMessages {
    Initial = "0",
    PlayerJoin = "1",
    PlayerLeave = "2",
    PlayerUpdate = "3"
}

export interface GameMessageTypes {
    [GameMessages.Initial]: Player[],
    [GameMessages.PlayerJoin]: Player,
    [GameMessages.PlayerLeave]: string,
    [GameMessages.PlayerUpdate]: Partial<Player> & { userId: string }
}

export interface MessageTypes {
    game: GameMessageTypes;
}