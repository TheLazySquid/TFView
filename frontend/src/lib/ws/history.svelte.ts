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

        this.ws.on(Message.GameUpdated, ({ rowid, ...changes }) => {
            let game = this.pastGames.find(g => g.rowid === rowid);
            if(!game) return;

            for(let key in changes) {
                // @ts-ignore
                game[key] = changes[key];
            }
        });
    }
}