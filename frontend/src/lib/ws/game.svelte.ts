import type { ChatMessage, KillfeedEntry, Player } from "$types/lobby";
import { Message } from "$types/messages";
import { maxKillfeedSize } from "../../../../shared/consts";
import { PageState } from "./wsclient.svelte";

export default new class Game extends PageState {
    type = "game";
    user: Player | null = $state.raw(null);
    players: Player[] = $state([]);
    playersMap = new Map<string, Player>();
    killfeed: KillfeedEntry[] = $state([]);
    // stored in reverse order for performance
    chat: ChatMessage[] = $state([]);

    setup() {
        this.ws.on(Message.InitialGame, (data) => {
            this.players = data.players;
            this.playersMap.clear();

            for(let player of this.players) {
                if(player.user) this.user = player;
                this.playersMap.set(player.userId, player);
            }

            this.killfeed = data.killfeed;
            this.chat = data.chat.toReversed(); 
        });

        this.ws.on(Message.PlayerJoin, (player) => {
            this.players.push(player);
            this.playersMap.set(player.userId, this.players[this.players.length - 1]);

            if(player.user) this.user = player;
        });

        this.ws.on(Message.PlayerLeave, (id) => {
            let index = this.players.findIndex((p) => p.userId === id);
            if(index === -1) return;

            if(this.players[index].user) this.user = null;
            this.players.splice(index, 1);
            this.playersMap.delete(id);
        });

        this.ws.on(Message.PlayerUpdate, (data) => {
            let player = this.playersMap.get(data.userId);
            if(!player) return;

            for(let key in data) {
                // @ts-ignore Oughta fix this, even "any" doesn't work
                player[key] = data[key];
            }
        });

        this.ws.on(Message.KillfeedAdded, (entry) => {
            this.killfeed.push(entry);
            if(this.killfeed.length > maxKillfeedSize) this.killfeed.shift();
        });

        this.ws.on(Message.ChatAdded, (message) => {
            this.chat.unshift(message);
        });
    }
}