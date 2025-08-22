import type { SteamPlayerSummaries } from "$types/steamapi";
import type { PlayerSummary } from "$types/lobby";
import { id3ToId64 } from "$shared/steamid";
import Settings from "src/settings/settings";
import Log from "src/log";
import HistoryDatabase from "src/history/database";
import { flags } from "src/consts";
import Values from "src/settings/values";

interface WaitingSummary {
	id3: string;
	id64: string;
	callback: (summary: PlayerSummary) => void;
	failedQueries: number;
	user?: boolean;
}

export default class SteamApi {
	static apiBase = "https://api.steampowered.com/"
	static summaryQueue: WaitingSummary[] = [];
	static maxSummaries = 150;

	static query(path: string, params: Record<string, any> = {}) {
		return new Promise<SteamPlayerSummaries>((res, rej) => {
			let searchParams = new URLSearchParams({
				key: Settings.get("steamApiKey"),
				...params
			});
			
			const url = this.apiBase + path + "/?" + searchParams.toString();

			fetch(url)
				.then((resp) => {
					// Wait longer and longer after each 429
					if(resp.status === 429) {
						this.delay += 10000;
					}

					if(resp.status !== 200) return rej(resp.status);
					return resp.json().then(res, rej);
				}, rej)
		});
	}

	static maxBatchSize = 100;
	static processSummariesFn() {
		if(this.summaryQueue.length === 0) return;
		let summaries = this.summaryQueue.splice(0, this.maxBatchSize);

		const ids = summaries.map(s => s.id64).join(",");

		// Steam really loves to give 429s
		this.query("ISteamUser/GetPlayerSummaries/v0002", { steamids: ids })
			.then((res) => {
				this.delay = this.baseDelay; // reset delay on success

				for(let player of res.response.players) {
					let waiting = summaries.find((s) => s.id64 === player.steamid);
					if(!waiting) continue;

					// Get the stored avatars
					let playerData = HistoryDatabase.getPlayerData(waiting.id3);
					let avatars = playerData ? playerData.avatars : [];

					if(playerData) {
						if(!avatars.includes(player.avatarhash)) avatars.push(player.avatarhash);
						if(playerData.avatarHash && !avatars.includes(playerData.avatarHash)) {
							avatars.push(playerData.avatarHash);
						}
					}

					const summary: PlayerSummary = {
						avatarHash: player.avatarhash,
						avatars,
						createdTimestamp: player.timecreated,
						name: player.personaname
					}

					// Update the player data
					if(waiting.user) {
						Values.set("userSummary", summary);
					} else {
						HistoryDatabase.setPlayerSummary(waiting.id3, summary);
					}

					waiting.callback(summary);
				}
			})
			.catch((e) => {
				if(typeof e === "number") {
					Log.warning(`Failed to get player summaries (status ${e})`);
				} else {
					Log.warning("Failed to get player summaries");
				}

				for(let i = 0; i < summaries.length; i++) {
					if(summaries[i].failedQueries >= 5) {
						Log.warning(`Failed to get player summary for ${summaries[i].id3} after 5 attempts`);
						summaries.splice(i, 1);
						i--;
					} else {
						summaries[i].failedQueries++;
					}
				}

				this.summaryQueue.push(...summaries);
				this.processSummaries();
			});
	}

	// The steam api allegedly has a ratelimit of 100k/day but it seems like steam will randomly
	// decide to shadowban you and just make 90% of your requests return 429s
	// It is unclear what triggers this or whether it ever goes away
	static baseDelay = 5000;
	static delay = this.baseDelay;
	static lastProcessTime = 0;
	static processTimeout: Timer | null = null;

	static processSummaries() {
		const now = Date.now();
		const elapsed = now - this.lastProcessTime;

		if (elapsed >= this.delay) {
			this.lastProcessTime = now;
			this.processSummariesFn();
		} else if (!this.processTimeout) {
			this.processTimeout = setTimeout(() => {
				this.processTimeout = null;
				this.lastProcessTime = Date.now();
				this.processSummariesFn();
			}, this.delay - elapsed);
		}
	}

	static getSummary(id3: string, callback: (summary: PlayerSummary) => void) {		
		const id64 = id3ToId64(id3);
		const waitingSummary = { id3, id64, callback, failedQueries: 0 };

		// Check if we have the summary stored
		let playerData = HistoryDatabase.getPlayerData(id3);
		let avatars = playerData ? playerData.avatars : [];

		if(playerData) {
			if(playerData.avatarHash && !avatars.includes(playerData.avatarHash)) {
				avatars.push(playerData.avatarHash);
			}
		}

		if(playerData && playerData.avatarHash && playerData.createdTimestamp) {
			callback({
				avatarHash: playerData.avatarHash,
				avatars,
				createdTimestamp: playerData.createdTimestamp,
				name: playerData.lastName
			});

			// Don't actively trigger a query- they happen in batches of 100, this one will happen eventually
			if(!flags.noSteamApi) this.summaryQueue.push(waitingSummary);
		} else if(!flags.noSteamApi) {
			this.summaryQueue.push(waitingSummary);
	
			// Let summaries accumilate if there's multiple in the same event loop
			setTimeout(() => this.processSummaries(), 0);
		}
	}

	static getUserSummary(id3: string, callback: (summary: PlayerSummary) => void) {
		const summary = Values.get("userSummary");
		if(summary) callback(summary);
		if(!Settings.get("steamApiKey")) return;

		const id64 = id3ToId64(id3);
		const waitingSummary = { id3, id64, callback, failedQueries: 0, user: true };

		if(!flags.noSteamApi) {
			this.summaryQueue.push(waitingSummary);
			
			if(!summary) setTimeout(() => this.processSummaries(), 0);
		}
	}
}