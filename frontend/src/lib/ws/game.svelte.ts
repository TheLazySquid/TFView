import type { CurrentServerInfo, Player } from "$types/lobby";
import { Message } from "$types/messages";
import { PageState } from "./wsclient.svelte";

export default new class Game extends PageState {
    type = "game";
    user: Player | null = $state.raw(null);
    players: Player[] = $state([]);
    playersMap = new Map<string, Player>();
    currentServer: CurrentServerInfo | null = $state(null);
    userColor: string | undefined = $state();
    definitelyNotInGame = $state(false);

    setup() {
        this.ws.on(Message.InitialPlayers, (players) => {
            console.log("Initial players", players);
            this.players = players;
            this.playersMap.clear();

            for(let player of this.players) {
                if(player.user) this.user = player;
                this.playersMap.set(player.ID3, player);
            }
        });

        this.ws.on(Message.PlayerJoin, (player) => {
            this.players.push(player);
            this.playersMap.set(player.ID3, this.players[this.players.length - 1]);

            if(player.user) this.user = player;
        });

        this.ws.on(Message.PlayerLeave, (id) => {
            let index = this.players.findIndex((p) => p.ID3 === id);
            if(index === -1) return;

            if(this.players[index].user) this.user = null;
            this.players.splice(index, 1);
            this.playersMap.delete(id);
        });

        this.ws.on(Message.PlayerUpdate, (data) => {
            let player = this.playersMap.get(data.ID3);
            if(!player) return;

            for(let key in data) {
                // @ts-ignore Oughta fix this, even "any" doesn't work
                player[key] = data[key];
            }

            if(data.kills !== undefined) this.sortPlayers();
        });

        this.ws.on(Message.CurrentServer, ({ server, definitelyNotInGame }) => {
            this.currentServer = server;
            if(definitelyNotInGame !== undefined) {
                this.definitelyNotInGame = definitelyNotInGame;
            }
        });

        this.ws.on(Message.UserColor, (color) => {
            this.userColor = color;
        });
    }

    // Sort by most to least kills to mimic the scoreboard
    sortPlayers() {
        this.players.sort((a, b) => b.kills - a.kills);
    }
}