import type { SteamPlayerSummaries } from "$types/steamapi";
import type { PlayerSummary } from "$types/lobby";
import { id3ToId64 } from "$shared/steamid";
import Settings from "src/settings/settings";
import throttle from "throttleit";
import Log from "src/log";

interface WaitingSummary {
	id3: string;
	id64: string;
	res: (summary: PlayerSummary) => void;
	failedQueries: number;
}

export default class PlayerData {
	static apiBase = "https://api.steampowered.com/"
	static summaries = new Map<string, PlayerSummary>();
	static removeQueue: string[] = [];
	static summaryQueue: WaitingSummary[] = [];
	static maxSummaries = 150;
	static key: string;

	static init() {
		this.key = Settings.get("steamApiKey");
	}

	static query(path: string, params: string[][] = []) {
		return new Promise<SteamPlayerSummaries>((res, rej) => {
			let searchParams = new URLSearchParams([["key", this.key], ...params]);
			const url = this.apiBase + path + "/?" + searchParams.toString();

			fetch(url)
				.then((resp) => {
					if(resp.status !== 200) return rej();
					return resp.json().then(res, rej);
				}, rej)
		});
	}

	static maxBatchSize = 100;
	static processSummariesFn() {
		if(this.summaryQueue.length === 0) return;
		let summaries = this.summaryQueue.splice(0, this.maxBatchSize);

		const ids = summaries.map(s => s.id64).join(",");

		// Steam really loves to give 429s despite 
		this.query("ISteamUser/GetPlayerSummaries/v0002", [["steamids", ids]])
			.then((res) => {
				for(let player of res.response.players) {
					let waiting = summaries.find((s) => s.id64 === player.steamid);
					if(!waiting) continue;

					const summary: PlayerSummary = {
						avatarHash: player.avatarhash,
						createdTimestamp: player.timecreated
					}

					waiting.res(summary);

					// add the summary to cache
					this.summaries.set(waiting.id3, summary);
					this.removeQueue.push(waiting.id3);
					if(this.removeQueue.length > this.maxSummaries) {
						this.summaries.delete(this.removeQueue.shift());
					}
				}
			})
			.catch(() => {
				Log.warning("Failed to get player summaries");

				for(let i = 0; i < summaries.length; i++) {
					if(summaries[i].failedQueries > 3) {
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

	// The steam api has a ratelimit of 100k/day, but there's an undocumented secondary ratelimit that's really low
	static minDelay = 7500;
	static processSummaries = throttle(this.processSummariesFn.bind(this), this.minDelay);

	static getSummary(id3: string) {
		return new Promise<PlayerSummary>((res) => {
			const id64 = id3ToId64(id3);
			
			// small cache for stuff like switching servers
			if(this.summaries.has(id64)) return res(this.summaries.get(id64));
			this.summaryQueue.push({ id3, id64, res, failedQueries: 0 });

			// Let summaries accumilate if there's multiple in the same event loop
			setTimeout(() => this.processSummaries(), 0);
		});
	}
}