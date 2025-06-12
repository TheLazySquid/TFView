import { id3ToId64 } from "$shared/steamid";
import type { PlayerSummary } from "$types/lobby";
import Settings from "src/settings/settings";
import SteamAPI from "steamapi";

export default class PlayerData {
	static api: SteamAPI;
	static summaries = new Map<string, PlayerSummary>();
	static summaryQueue: string[] = [];
	static maxSummaries = 150;

	static init() {
		const key = Settings.get("steamApiKey");
		if(!key) return;

		this.api = new SteamAPI(key);
	}

	static getSummary(id3: string) {
		return new Promise<PlayerSummary>((res, rej) => {
			const id64 = id3ToId64(id3);
			if(this.summaries.has(id64)) return res(this.summaries.get(id64));
	
			this.api.getUserSummary(id64)
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