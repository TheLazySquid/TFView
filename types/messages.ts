import type { SettingsType, PastGame, PastGameEntry, PlayerEncounter, Tag, StoredPlayer } from "./data";
import type { ChatMessage, CurrentServerInfo, KillfeedEntry, Lobby, Player } from "./lobby";

// Sending messages from the backend
export enum Message {
    Warning,
    Error,
    InitialGame,
    PlayerJoin,
    PlayerLeave,
    PlayerUpdate,
    KillfeedAdded,
    ChatAdded,
    GameAdded,
    GameUpdated,
    InitialSettings,
    SettingUpdate,
    CurrentServer,
    Tags,
    UserColor
}

export interface MessageTypes {
    [Message.Warning]: string;
    [Message.Error]: string;
    [Message.InitialGame]: Lobby;
    [Message.PlayerJoin]: Player;
    [Message.PlayerLeave]: string;
    [Message.PlayerUpdate]: Partial<Player> & { userId: string };
    [Message.KillfeedAdded]: KillfeedEntry;
    [Message.ChatAdded]: ChatMessage;
    [Message.GameAdded]: PastGameEntry;
    [Message.GameUpdated]: Partial<PastGameEntry> & { rowid: number };
    [Message.InitialSettings]: SettingsType;
    [Message.SettingUpdate]: { key: keyof SettingsType, value: any };
    [Message.CurrentServer]: CurrentServerInfo | null;
    [Message.Tags]: Tag[];
    [Message.UserColor]: string | undefined;
}

// Recieving messages
export type Recieved<Send, Reply = void> = { send: Send, reply: Reply };

export enum Recieves {
    Chat,
    ChatTeam,
    GetGames,
    GetGame,
    GetEncounters,
    UpdateSetting,
    SetNickname,
    SetNote,
    SetTags,
    GetPlayers
}

export interface RecievesTypes {
    [Recieves.Chat]: Recieved<string>;
    [Recieves.ChatTeam]: Recieved<string>;
    [Recieves.GetGames]: Recieved<number, { total?: number, games: PastGameEntry[] }>;
    [Recieves.GetGame]: Recieved<number, PastGame>;
    [Recieves.GetEncounters]: Recieved<{ id: string, offset: number }, { total?: number, encounters: PlayerEncounter[] }>;
    [Recieves.UpdateSetting]: Recieved<{ key: keyof SettingsType, value: any }>;
    [Recieves.SetNickname]: Recieved<{ id: string, nickname: string | null }>;
    [Recieves.SetNote]: Recieved<{ id: string, note: string }>;
    [Recieves.SetTags]: Recieved<{ id: string, tags: Record<string, boolean> }>;
    [Recieves.GetPlayers]: Recieved<number, { total?: number, players: StoredPlayer[] }>;
}

export type RecievesKey<C extends keyof RecievesTypes, K extends keyof Recieved<any, any>> =
    RecievesTypes[C] extends Recieved<any, any> ? RecievesTypes[C][K] : never;