import type { PastGame, PastGameEntry, PlayerEncounter } from "./data";
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
    GameAdded = "0"
}

export interface HistoryMessageTypes {
    [HistoryMessages.GameAdded]: PastGameEntry;
}

export interface MessageTypes {
    game: GameMessageTypes;
    history: HistoryMessageTypes;
}

// Recieving messages
export type Recieved<Send, Reply = void> = { send: Send, reply: Reply };

export enum Recieves {
    Chat = "0",
    ChatTeam = "1",
    GetGames = "2",
    GetGame = "3",
    GetEncounters = "4"
}

export interface RecievesTypes {
    [Recieves.Chat]: Recieved<string>;
    [Recieves.ChatTeam]: Recieved<string>;
    [Recieves.GetGames]: Recieved<number, PastGameEntry[]>;
    [Recieves.GetGame]: Recieved<number, PastGame>;
    [Recieves.GetEncounters]: Recieved<{ id: string, offset: number }, PlayerEncounter[]>;
}

export type RecievesKey<C extends keyof RecievesTypes, K extends keyof Recieved<any, any>> =
    RecievesTypes[C] extends Recieved<any, any> ? RecievesTypes[C][K] : never;