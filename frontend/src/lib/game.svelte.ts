import type { ChatMessage, KillfeedEntry, Player } from "$types/lobby";
import { GameMessages } from "$types/messages";
import WSClient from "./wsclient";

export default new class Game extends WSClient<"game"> {
    players: Player[] = $state([]);
    playersMap = new Map<string, Player>();
    killfeed: KillfeedEntry[] = $state([]);
    // stored in reverse order for performance
    chat: ChatMessage[] = $state([]);

    constructor() {
        super("game");
    }

    init() {
        this.on(GameMessages.Initial, (data) => {
            this.players = data.players;
            this.playersMap.clear();
            for(let player of this.players) {
                this.playersMap.set(player.userId, player);
            }

            this.killfeed = data.killfeed;
            this.chat = data.chat.toReversed();
        })

        this.on(GameMessages.PlayerJoin, (player) => {
            this.players.push(player);
            this.playersMap.set(player.userId, this.players[this.players.length - 1]);
        });

        this.on(GameMessages.PlayerLeave, (id) => {
            let index = this.players.findIndex((p) => p.userId === id);
            if(index === -1) return;

            this.players.splice(index, 1);
            this.playersMap.delete(id);
        });

        this.on(GameMessages.PlayerUpdate, (data) => {
            let player = this.playersMap.get(data.userId);
            if(!player) return;

            for(let key in data) {
                // @ts-ignore Oughta fix this, even "any" doesn't work
                player[key] = data[key];
            }
        });

        this.on(GameMessages.KillfeedAdded, (entry) => {
            this.killfeed.push(entry);
        });

        this.on(GameMessages.ChatAdded, (message) => {
            this.chat.unshift(message);
        });
    }
}