import type { BanInfo, SourceBansResponse } from "$types/apis";
import Settings from "src/settings/settings"
import { BatchRequester } from "./batchRequester";
import { id3ToId64 } from "$shared/steamid";
import HistoryDatabase from "src/history/database";

export default class SourceBans {
    static bansRequester: BatchRequester<BanInfo[]>;
    
    static init() {
        this.bansRequester = new BatchRequester<BanInfo[]>({
            name: "SourceBans",
            batchSize: 100,
            getUrl: this.getUrl.bind(this),
            handleResponse: (data: SourceBansResponse, batch) => {
                for(const request of batch) {
                    request.res(data.response[request.id] ?? []);
                }
            }
        });
    }

    static getUrl(ids: string[]) {
        const params = new URLSearchParams({
            key: Settings.get("steamhistoryApiKey"),
            steamids: ids.join(","),
            shouldkey: "1"
        });

        return "https://steamhistory.net/api/sourcebans?" + params.toString();
    }

    static banInfo = new Map<string, BanInfo[]>();

    static onLeave(id3: string) {
        this.banInfo.delete(id3);
    }

    static async getBanned(id3: string) {
        if(!Settings.get("steamhistoryApiKey")) return false;
        const id64 = id3ToId64(id3);

        try {
            const bans = await this.bansRequester.request(id64, 0);
            this.banInfo.set(id3, bans);
            if(bans.length > 0) HistoryDatabase.markPlayerSourceBanned(id3);
            return bans.length > 0;
        } catch {
            return false;
        }
    }
    
    static async getBans(id3: string) {
        if(!Settings.get("steamhistoryApiKey")) return [];
        if(this.banInfo.has(id3)) return this.banInfo.get(id3);

        const id64 = id3ToId64(id3);

        try {
            const bans = await this.bansRequester.request(id64, 0);
            this.banInfo.set(id3, bans);
            if(bans.length > 0) HistoryDatabase.markPlayerSourceBanned(id3);
            return bans;
        } catch {
            return [];
        }
    }
}