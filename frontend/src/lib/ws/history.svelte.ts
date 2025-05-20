import type { PastGame } from "$types/data";
import { HistoryMessages } from "$types/messages";
import WSClient from "./wsclient";

export default new class History extends WSClient<"history"> {
    route = "history";
    pastGames: PastGame[] = $state([]);

    setup() {
        this.on(HistoryMessages.Initial, (data) => {
            console.log(data);
            this.pastGames = data.pastGames;
        });

        this.on(HistoryMessages.GameAdded, (game) => {
            this.pastGames.unshift(game);
        });
    }
}