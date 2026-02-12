import type { SourceBanInfo, SourceBansResponse } from "$types/apis";
import Settings from "src/settings/settings"
import { BatchRequester } from "./batchRequester";
import { id3ToId64 } from "$shared/steamid";
import HistoryDatabase from "src/history/database";
import Server from "./server";
import { Recieves } from "$types/messages";

export default class SourceBans {
    static bansRequester: BatchRequester<SourceBanInfo[]>;
    static banInfo = new Map<string, SourceBanInfo[]>();
    
    static init() {
        this.bansRequester = new BatchRequester<SourceBanInfo[]>({
            name: "SourceBans",
            batchSize: 100,
            getUrl: this.getUrl.bind(this),
            handleResponse: (data: SourceBansResponse, batch) => {
                for(const request of batch) {
                    request.res(data.response[request.id] ?? []);
                }
            }
        });

        Server.on(Recieves.GetSourcebans, (id3, { reply }) => {
            this.getBans(id3)
                .then((bans) => reply(bans))
                .catch(() => reply(null));
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
        if(this.banInfo.has(id3)) return this.banInfo.get(id3);
        if(!Settings.get("steamhistoryApiKey")) throw new Error("No SteamHistory API key");
        
        const id64 = id3ToId64(id3);
        const bans = await this.bansRequester.request(id64, 0);
        return bans;
    }
}