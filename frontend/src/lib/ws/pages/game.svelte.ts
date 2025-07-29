import Popups from "$lib/popups";
import type { CurrentServerInfo, Player } from "$types/lobby";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class Game {
    userTeam = $state(-1);
    players: Player[] = $state([]);
    playersMap = new Map<string, Player>();
    currentServer: CurrentServerInfo | null = $state(null);
    userColor: string | undefined = $state();
    definitelyNotInGame = $state(false);

    constructor() {
        WS.on(Message.InitialPlayers, (players) => {
            console.log("Initial players", players);
            this.players = players;
            this.playersMap.clear();

            for(let player of this.players) {
                if(player.user) this.userTeam = player.team;
                this.playersMap.set(player.ID3, player);
            }
        });

        WS.on(Message.PlayerJoin, (player) => {
            this.players.push(player);
            this.playersMap.set(player.ID3, this.players[this.players.length - 1]);

            if(player.user) this.userTeam = player.team;
        });

        WS.on(Message.PlayerLeave, (id) => {
            let index = this.players.findIndex((p) => p.ID3 === id);
            if(index === -1) return;

            if(this.players[index].user) this.userTeam = -1;
            this.players.splice(index, 1);
            this.playersMap.delete(id);
        });

        WS.on(Message.PlayerUpdate, (data) => {
            let player = this.playersMap.get(data.ID3);
            if(!player) return;

            for(let key in data) {
                // @ts-ignore Oughta fix this, even "any" doesn't work
                player[key] = data[key];
            }

            if(data.kills !== undefined) this.sortPlayers();
            if(player.user && data.team) this.userTeam = data.team;
        });

        WS.on(Message.CurrentServer, ({ server, definitelyNotInGame }) => {
            this.currentServer = server;
            if(definitelyNotInGame !== undefined) {
                this.definitelyNotInGame = definitelyNotInGame;
            }
        });

        WS.on(Message.UserColor, (color) => {
            this.userColor = color;
        });
    }

    // Sort by most to least kills to mimic the scoreboard
    sortPlayers() {
        this.players.sort((a, b) => b.kills - a.kills);
    }

    openPlayer(id: string) {
        let player = this.playersMap.get(id);
        if(player) {
            Popups.open("player", player);
        } else {
            Popups.open("pastPlayer", id);
        }
    }
}