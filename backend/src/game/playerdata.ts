import type { PlayerSummary } from "$types/lobby";
import Config from "src/config";
import SteamAPI from "steamapi";
import SteamID from "steamid";

export default class PlayerData {
	static api: SteamAPI;
	static summaries = new Map<string, PlayerSummary>();
	static summaryQueue: string[] = [];
	static maxSummaries = 150;

	static init() {
		const key = Config.get("steamApiKey");
		if(!key) return;

		this.api = new SteamAPI(key);
	}

	static getSummary(id3: string) {
		return new Promise<PlayerSummary>((res, rej) => {
			const id = new SteamID(`[U:1:${id3}]`).getSteamID64();
			if(this.summaries.has(id)) return res(this.summaries.get(id));
	
			this.api.getUserSummary(id)
				.then((summaryRes) => {
					// only reply with the bits we care about
					const summary: PlayerSummary = {
						avatarHash: summaryRes.avatar.hash,
						createdTimestamp: summaryRes.createdTimestamp
					}
			
					// overkill? Who knows
					this.summaries.set(id3, summary);
					this.summaryQueue.push(id3);
					if(this.summaryQueue.length > this.maxSummaries) {
						this.summaries.delete(this.summaryQueue.shift());
					}

					res(summary);
				})
				.catch(rej);
		});
	}
}