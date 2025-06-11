import type { PastGameEntry } from "$types/data";
import { Message } from "$types/messages";
import { PageState } from "./wsclient.svelte";

export default new class History extends PageState {
    type = "history";
    pastGames: PastGameEntry[] = $state([]);

    setup() {
        this.ws.on(Message.GameAdded, (game) => {
            this.pastGames.unshift(game);
        });
    }
}