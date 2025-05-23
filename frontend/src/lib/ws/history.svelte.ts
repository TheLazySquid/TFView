import type { PastGameEntry } from "$types/data";
import { HistoryMessages } from "$types/messages";
import { PageState } from "./wsclient";

export default new class History extends PageState<"history"> {
    type = "history";
    pastGames: PastGameEntry[] = $state([]);

    setup() {
        this.ws.on(HistoryMessages.GameAdded, (game) => {
            this.pastGames.unshift(game);
        });
    }
}