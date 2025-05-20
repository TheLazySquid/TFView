import type { HistoryType, PastGame } from "./data";
import type { ChatMessage, KillfeedEntry, Lobby, Player } from "./lobby";

// Sending messages from the backend
export enum GameMessages {
    Initial = "0",
    PlayerJoin = "1",
    PlayerLeave = "2",
    PlayerUpdate = "3",
    KillfeedAdded = "4",
    ChatAdded = "5"
}

export interface GameMessageTypes {
    [GameMessages.Initial]: Lobby;
    [GameMessages.PlayerJoin]: Player;
    [GameMessages.PlayerLeave]: string;
    [GameMessages.PlayerUpdate]: Partial<Player> & { userId: string };
    [GameMessages.KillfeedAdded]: KillfeedEntry;
    [GameMessages.ChatAdded]: ChatMessage;
}

export enum HistoryMessages {
    Initial = "0",
    GameAdded = "1"
}

export interface HistoryMessageTypes {
    [HistoryMessages.Initial]: HistoryType;
    [HistoryMessages.GameAdded]: PastGame;
}

export interface MessageTypes {
    game: GameMessageTypes;
    history: HistoryMessageTypes;
}

// Recieving messages
export type Recieves<Send, Reply = void> = { send: Send, reply: Reply };

export enum GameRecieves {
    Chat = "0",
    ChatTeam = "1"
}

export interface GameRecievesTypes {
    [GameRecieves.Chat]: Recieves<string>;
    [GameRecieves.ChatTeam]: Recieves<string>;
}

export enum HistoryRecieves {
    GetGames = "0"
}

export interface HistoryRecievesTypes {
    [HistoryRecieves.GetGames]: Recieves<number, PastGame[]>;
}

export interface RecievesTypes {
    game: GameRecievesTypes;
    history: HistoryRecievesTypes;
}

export type RecievesKey<T extends keyof RecievesTypes, C extends keyof RecievesTypes[T], K extends keyof Recieves<any, any>> =
    RecievesTypes[T][C] extends Recieves<any, any> ? RecievesTypes[T][C][K] : never;