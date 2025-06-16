import type { PastGameEntry } from "$types/data";
import { Message } from "$types/messages";
import { PageState } from "./wsclient.svelte";

export default new class GameHistory extends PageState {
    type = "gamehistory";
    pastGames: PastGameEntry[] = $state([]);
    totalGames: number | undefined = $state();

    setup() {
        this.ws.on(Message.GameAdded, (game) => {
            this.pastGames.unshift(game);
            if(this.totalGames) this.totalGames++;
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