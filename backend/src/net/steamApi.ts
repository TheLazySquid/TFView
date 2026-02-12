import type { SteamFriendsList, SteamPlayerSummaries, SteamPlayerSummary } from "$types/apis";
import type { PlayerSummary } from "$types/lobby";
import { id3ToId64, id64ToId3 } from "$shared/steamid";
import Settings from "src/settings/settings";
import Log from "src/log";
import HistoryDatabase from "src/history/database";
import { flags, friendCheckInterval } from "src/consts";
import Values from "src/settings/values";
import type { PastPlayer } from "$types/data";
import Server from "./server";
import { Message, Recieves } from "$types/messages";
import { getCurrentUserId } from "src/util";
import { BatchRequester } from "./batchRequester";

export default class SteamApi {
	static apiBase = "https://api.steampowered.com/"
	static summaryRequester: BatchRequester<SteamPlayerSummary>;

	static init() {
		this.summaryRequester = new BatchRequester<SteamPlayerSummary>({
			name: "Steam API",
			batchSize: 100,
			getUrl: (ids) => this.getRequestUrl("ISteamUser/GetPlayerSummaries/v2", { steamids: ids.join(",") }),
			handleResponse: (data: SteamPlayerSummaries, batch) => {
				for(let summary of data.response.players) {
					let waiting = batch.find((s) => s.id === summary.steamid);
					if(waiting) waiting.res(summary);
					else waiting.rej();
				}
			}
		});

		Server.on(Recieves.GetFriends, async (id3, { reply }) => {
			const friends = await this.getPlayerFriends(id3);
			reply(friends);
		});

		Server.onConnect("userfriends", (respond) => {
			respond(Message.UserFriendIds, Values.get("friendIds") ?? []);
		});

		Settings.on("steamApiKey", this.tryGetUserFriends.bind(this));
		Settings.on("steamPath", this.tryGetUserFriends.bind(this));
		this.tryGetUserFriends();
	}

	static getRequestUrl(path: string, params: Record<string, any> = {}) {
		let searchParams = new URLSearchParams({
			key: Settings.get("steamApiKey"),
			...params
		});
		
		return this.apiBase + path + "/?" + searchParams.toString();
	}

	static query<T>(path: string, params: Record<string, any> = {}) {
		return new Promise<T>((res, rej) => {
			const url = this.getRequestUrl(path, params);

			fetch(url).then((resp) => {
				if(resp.status !== 200) return rej(resp.status);
				return resp.json().then(res, rej);
			}, rej)
		});
	}

	static processSteamSummary(id3: string, steamSummary: SteamPlayerSummary): PlayerSummary {
		let playerData = HistoryDatabase.getPlayerData(id3);
		let avatars = playerData?.avatars ? playerData.avatars : [];

		if(playerData) {
			if(!avatars.includes(steamSummary.avatarhash)) avatars.push(steamSummary.avatarhash);
			if(playerData.avatarHash && !avatars.includes(playerData.avatarHash)) {
				avatars.push(playerData.avatarHash);
			}
		}

		return {
			avatarHash: steamSummary.avatarhash,
			avatars,
			createdTimestamp: steamSummary.timecreated,
			name: steamSummary.personaname
		}
	}

	// The steam api allegedly has a ratelimit of 100k/day but it seems like steam will randomly
	// decide to shadowban you and just make 90% of your requests return 429s
	// It is unclear what triggers this or whether it ever goes away
	static getSummary(id3: string, callback: (summary: PlayerSummary) => void, deprioritize = false) {
		const id64 = id3ToId64(id3);

		// Check if we have the summary stored
		let playerData = HistoryDatabase.getPlayerData(id3);
		let avatars = playerData?.avatars ? playerData.avatars : [];

		if(playerData) {
			if(playerData.avatarHash && !avatars.includes(playerData.avatarHash)) {
				avatars.push(playerData.avatarHash);
			}
		}

		const shouldQuery = !flags.noSteamApi && Settings.get("steamApiKey");

		if(playerData && playerData.avatarHash && playerData.createdTimestamp) {
			callback({
				avatarHash: playerData.avatarHash,
				avatars,
				createdTimestamp: playerData.createdTimestamp,
				name: playerData.lastName
			});

			if(shouldQuery) {
				// If the query isn't priority don't start a second batch of summaries
				if(deprioritize && this.summaryRequester.batchFull) return;

				// This query will probably happen on its own, but just in case it doesn't
				this.summaryRequester.request(id64, 30000).then((steamSummary) => {
					const summary = this.processSteamSummary(id3, steamSummary);
					HistoryDatabase.setPlayerSummary(id3, summary)
					callback(summary);
				}, () => {});
			}
		} else if(shouldQuery) {
			if(deprioritize && this.summaryRequester.batchFull) return;
	
			// Let summaries accumilate if there's multiple in the same event loop
			this.summaryRequester.request(id64, 0).then((steamSummary) => {
				const summary = this.processSteamSummary(id3, steamSummary);
				HistoryDatabase.setPlayerSummary(id3, summary)
				callback(summary);
			}, () => {});
		}
	}

	static getUserSummary(id3: string, callback: (summary: PlayerSummary) => void) {
		const existingSummary = Values.get("userSummary");
		if(existingSummary) callback(existingSummary);
		if(!Settings.get("steamApiKey")) return;

		const id64 = id3ToId64(id3);

		if(!flags.noSteamApi && !existingSummary) {			
			this.summaryRequester.request(id64, 0).then((steamSummary) => {
				const summary = this.processSteamSummary(id3, steamSummary);
				Values.set("userSummary", summary);
				callback(summary);
			});
		}
	}

	static async tryGetUserFriends() {
		if(!Settings.get("steamApiKey") || flags.noSteamApi) return;

		const lastCheck = Values.get("lastFriendFetch") ?? 0;
		const elapsed = Date.now() - lastCheck;
		if(elapsed < friendCheckInterval) return;

		const userId = await getCurrentUserId();
		if(!userId) return;

		const friendIds = await this.getFriendIds(userId);
		if(!friendIds) return;

		Values.set("friendIds", friendIds);
		Server.send("userfriends", Message.UserFriendIds, friendIds);
	}

	static async getFriendIds(id3: string) {
		if(!Settings.get("steamApiKey") || flags.noSteamApi) return null;

		try {
			const id64 = id3ToId64(id3);
			const res = await this.query<SteamFriendsList>("ISteamUser/GetFriendList/v1", { steamid: id64 });
			return res.friendslist.friends.map(f => id64ToId3(f.steamid));
		} catch(e) {
			// Expected if the user has a private friends list
			if(e !== 401) Log.warning(`Failed to get friend for ${id3} from Steam API`);
			return null;
		}
	}

	// This is only called when the user actively clicks on a profile so we don't really care about the ratelimit
	static async getPlayerFriends(id3: string) {
		const friendIds = await this.getFriendIds(id3);
		if(friendIds === null) return null;

		const friends: PastPlayer[] = [];
		for(const id of friendIds) {
			const playerdata = HistoryDatabase.getPlayerData(id);
			if(playerdata) friends.push(playerdata);
		}

		return friends;
	}
}