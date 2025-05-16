import type { Player } from "$types/lobby";
import { GameMessages, type GameMessageTypes } from "$types/messages";
import WSClient from "./wsclient";

export default new class Game extends WSClient<GameMessageTypes> {
    players: Player[] = $state([
        {
            name: "Swag Messiah",
            team: 2,
            ping: 50,
            health: 125,
            alive: true,
            userId: "15",
            accountId: "9349"
        }
    ]);
    playersMap = new Map<string, Player>();

    constructor() {
        super("game");
    }

    init() {
        this.on(GameMessages.Initial, (players) => {
            this.players = players;
            this.playersMap.clear();
            for(let player of this.players) {
                this.playersMap.set(player.userId, player);
            }
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
    }
}