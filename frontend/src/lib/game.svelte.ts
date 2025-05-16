import type { KillfeedEntry, Player } from "$types/lobby";
import { GameMessages, type GameMessageTypes } from "$types/messages";
import WSClient from "./wsclient";

export default new class Game extends WSClient<GameMessageTypes> {
    players: Player[] = $state([]);
    playersMap = new Map<string, Player>();
    killfeed: KillfeedEntry[] = $state([]);

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
    }
}