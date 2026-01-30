export interface SteamPlayerSummary {
    steamid: string;
    communityvisibilitystate: number;
    profilestate: number;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    avatarhash: string;
    personastate: number;
    realname: string;
    primaryclanid: string;
    timecreated: number;
    personastateflags: number;
}

export interface SteamPlayerSummaries {
    response: {
        players: SteamPlayerSummary[];
    }
}

export interface SteamFriend {
    steamid: string;
    relationship: string;
    friend_since: number;
}

export interface SteamFriendsList {
    friendslist: {
        friends: SteamFriend[];
    }
}