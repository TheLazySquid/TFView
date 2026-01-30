import type { CasualConfig, CasualProfile, GameDir, GameDirectories, PastPlayer, SettingsType, StoredPastGame, Tag } from "./data";
import type { CurrentServerInfo, KickReason, Player } from "./lobby";

// Sending messages from the backend
export type SentMessage<Channel, Data> = { channel: Channel, data: Data };

export enum Message {
    Success,
    Warning,
    Error,
    InitialPlayers,
    PlayerJoin,
    PlayerLeave,
    PlayerUpdate,
    InitialSettings,
    SettingUpdate,
    CurrentServer,
    Tags,
    UserColor,
    Directories,
    RconConnected,
    CasualConfig,
    OfferStartMenuShortcut,
    KillCounts,
    KillCountUpdate,
    UpdateAvailable,
    PastPlayerUpdate,
    InitialPlayerIds,
    PlayerIdClear,
    PlayerIdJoin,
    PlayerIdLeave
}

export type MessageTypes =
    | SentMessage<Message.Success, string>
    | SentMessage<Message.Warning, string>
    | SentMessage<Message.Error, string>
    | SentMessage<Message.InitialPlayers, Player[]>
    | SentMessage<Message.PlayerJoin, Player>
    | SentMessage<Message.PlayerLeave, string>
    | SentMessage<Message.PlayerUpdate, Partial<Player> & { ID3: string }>
    | SentMessage<Message.InitialSettings, SettingsType>
    | SentMessage<Message.SettingUpdate, { key: keyof SettingsType, value: any }>
    | SentMessage<Message.CurrentServer, { server: CurrentServerInfo | null, definitelyNotInGame?: boolean }>
    | SentMessage<Message.Tags, Tag[]>
    | SentMessage<Message.UserColor, string | undefined>
    | SentMessage<Message.Directories, GameDirectories>
    | SentMessage<Message.RconConnected, boolean>
    | SentMessage<Message.CasualConfig, CasualConfig>
    | SentMessage<Message.OfferStartMenuShortcut, void>
    | SentMessage<Message.KillCounts, Record<string, [number, number]>>
    | SentMessage<Message.KillCountUpdate, { weapon: string, count: [number, number] }>
    | SentMessage<Message.UpdateAvailable, string>
    | SentMessage<Message.PastPlayerUpdate, Partial<PastPlayer> & { id: string }>
    | SentMessage<Message.InitialPlayerIds, string[]>
    | SentMessage<Message.PlayerIdClear, void>
    | SentMessage<Message.PlayerIdJoin, string>
    | SentMessage<Message.PlayerIdLeave, string>
    | SentMessage<`list-${string}-addStart`, any>
    | SentMessage<`list-${string}-update`, { id: any, update: any }>
    | SentMessage<`list-${string}-delete`, any>

// Recieving messages
export type RecievedMessage<Channel, Data, Reply = void> = { channel: Channel, data: Data, replyType: Reply };

export enum Recieves {
    Chat,
    ChatTeam,
    GetGame,
    GetPlayer,
    UpdateSetting,
    SetNickname,
    SetNote,
    SetTags,
    DeleteGame,
    KickPlayer,
    OpenDirectoryPicker,
    ChangeDirectory,
    CheckLaunchOptions,
    ApplyLaunchOptions,
    GetRconPassword,
    CheckAutoexec,
    ApplyAutoexec,
    FinishSetup,
    GetSetting,
    CloseGame,
    CloseApp,
    SelectCasualProfile,
    UpdateCasualProfile,
    NewCasualProfile,
    DeleteCasualProfile,
    LaunchGame,
    WantsStartMenuShortcut,
    WantsToUpdate,
    GetFriends
}

export type RecievesTypes = 
    | RecievedMessage<Recieves.Chat, string>
    | RecievedMessage<Recieves.ChatTeam, string>
    | RecievedMessage<Recieves.GetGame, number, StoredPastGame>
    | RecievedMessage<Recieves.GetPlayer, string, PastPlayer>
    | RecievedMessage<Recieves.UpdateSetting, { key: keyof SettingsType, value: any }>
    | RecievedMessage<Recieves.GetSetting, keyof SettingsType, any>
    | RecievedMessage<Recieves.SetNickname, { id: string, nickname: string | null }>
    | RecievedMessage<Recieves.SetNote, { id: string, note: string }>
    | RecievedMessage<Recieves.SetTags, { id: string, tags: Record<string, boolean> }>
    | RecievedMessage<Recieves.DeleteGame, number, true | string>
    | RecievedMessage<Recieves.KickPlayer, { userId: string, reason: KickReason }>
    | RecievedMessage<Recieves.OpenDirectoryPicker, GameDir>
    | RecievedMessage<Recieves.ChangeDirectory, { type: GameDir, path: string }>
    | RecievedMessage<Recieves.CheckLaunchOptions, void, boolean>
    | RecievedMessage<Recieves.ApplyLaunchOptions, void, boolean>
    | RecievedMessage<Recieves.GetRconPassword, boolean, string | undefined>
    | RecievedMessage<Recieves.CheckAutoexec, boolean, boolean>
    | RecievedMessage<Recieves.ApplyAutoexec, boolean, boolean>
    | RecievedMessage<Recieves.FinishSetup, void, true>
    | RecievedMessage<Recieves.CloseGame, void>
    | RecievedMessage<Recieves.CloseApp, boolean>
    | RecievedMessage<Recieves.SelectCasualProfile, string>
    | RecievedMessage<Recieves.UpdateCasualProfile, CasualProfile>
    | RecievedMessage<Recieves.NewCasualProfile, string>
    | RecievedMessage<Recieves.DeleteCasualProfile, string>
    | RecievedMessage<Recieves.LaunchGame, void>
    | RecievedMessage<Recieves.WantsStartMenuShortcut, boolean>
    | RecievedMessage<Recieves.WantsToUpdate, string>
    | RecievedMessage<Recieves.GetFriends, string, PastPlayer[]>
    | RecievedMessage<`list-${string}`, { offset: number, params: any }, { total?: number, items: any[] }>

export type Page = "game" | "playerhistory" | "gamehistory" | "settings" | "setup" | "casual" | "killcounts";