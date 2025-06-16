import type { SettingsType, PastGame, PastGameEntry, PlayerEncounter, Tag, StoredPlayer } from "./data";
import type { ChatMessage, CurrentServerInfo, KillfeedEntry, Lobby, Player } from "./lobby";

// Sending messages from the backend
export type SentMessage<Channel, Data> = { channel: Channel, data: Data };

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

export type MessageTypes =
    | SentMessage<Message.Warning, string>
    | SentMessage<Message.Error, string>
    | SentMessage<Message.InitialGame, Lobby>
    | SentMessage<Message.PlayerJoin, Player>
    | SentMessage<Message.PlayerLeave, string>
    | SentMessage<Message.PlayerUpdate, Partial<Player> & { userId: string }>
    | SentMessage<Message.KillfeedAdded, KillfeedEntry>
    | SentMessage<Message.ChatAdded, ChatMessage>
    | SentMessage<Message.InitialSettings, SettingsType>
    | SentMessage<Message.SettingUpdate, { key: keyof SettingsType, value: any }>
    | SentMessage<Message.CurrentServer, CurrentServerInfo | null>
    | SentMessage<Message.Tags, Tag[]>
    | SentMessage<Message.UserColor, string | undefined>
    | SentMessage<`list-${string}-addStart`, any>
    | SentMessage<`list-${string}-update`, { id: string, update: any }>

// Recieving messages
export type RecievedMessage<Channel, Data, Reply = void> = { channel: Channel, data: Data, replyType: Reply };

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

export type RecievesTypes = 
    | RecievedMessage<Recieves.Chat, string, void>
    | RecievedMessage<Recieves.ChatTeam, string, void>
    | RecievedMessage<Recieves.GetGames, number, { total?: number, games: PastGameEntry[] }>
    | RecievedMessage<Recieves.GetGame, number, PastGame>
    | RecievedMessage<Recieves.GetEncounters, { id: string, offset: number }, { total?: number, encounters: PlayerEncounter[] }>
    | RecievedMessage<Recieves.UpdateSetting, { key: keyof SettingsType, value: any }, void>
    | RecievedMessage<Recieves.SetNickname, { id: string, nickname: string | null }, void>
    | RecievedMessage<Recieves.SetNote, { id: string, note: string }, void>
    | RecievedMessage<Recieves.SetTags, { id: string, tags: Record<string, boolean> }, void>
    | RecievedMessage<Recieves.GetPlayers, number, { total?: number, players: StoredPlayer[] }>
    | RecievedMessage<`list-${string}`, number, { total?: number, items: any[] }>