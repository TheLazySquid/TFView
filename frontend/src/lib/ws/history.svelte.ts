import type { PastGameEntry } from "$types/data";
import { HistoryMessages } from "$types/messages";
import WSClient from "./wsclient";

export default new class History extends WSClient<"history"> {
    route = "history";
    pastGames: PastGameEntry[] = $state([]);

    setup() {
        this.on(HistoryMessages.GameAdded, (game) => {
            this.pastGames.unshift(game);
        });
    }
}