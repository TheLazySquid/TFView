import type { Lobby, Player } from "$types/lobby";
import Rcon from "./rcon";

export default class LobbyMonitor {
    static lobby: Lobby = { players: [] };
    static playerMap = new Map<string, Player>();
    static pollInterval = 1000;

    static init() {
        setInterval(() => this.poll(), this.pollInterval);
    }

    static poll() {
        if(!Rcon.connected) return;

        Rcon.server.execute("g15_dumpplayer")
            .then((text) => {
                if(typeof text !== "string") return;
                this.parseG15(text);
            });
    }

    static g15Regex = /m_(.+)\[(\d+)\] .+ \((.+)\)(?:\n|$)/g;
    static parseG15(text: string) {
        let info: Record<string, string>[] = [];
        for(let i = 0; i <= 101; i++) info.push({});

        let match: RegExpExecArray;
        while(match = this.g15Regex.exec(text)) {
            let index = parseInt(match[2]);
            info[index][match[1]] = match[3];
        }

        const ids = new Set<string>();

        // add/update players
        for(let i = 0; i <= 101; i++) {
            const playerInfo = info[i];
            const id = playerInfo.iUserID;
            ids.add(id);
            if(id === "0") continue;
            
            let player: Partial<Player> = {};
            if(this.playerMap.has(id)) player = this.playerMap.get(id);

            // update relevant data
            player.accountId = playerInfo.iAccountID;
            player.userId = playerInfo.iUserID;
            player.name = playerInfo.szName;
            player.alive = playerInfo.bAlive === "true";
            player.ping = parseInt(playerInfo.iPing);
            player.team = parseInt(playerInfo.iTeam);
            player.health = parseInt(playerInfo.iHealth);

            if(!this.playerMap.has(id)) {
                this.lobby.players.push(player as Player);
                this.playerMap.set(id, player as Player);
            }
        }

        // remove players that have left
        for(let i = 0; i < this.lobby.players.length; i++) {
            const id = this.lobby.players[i].userId;
            if(ids.has(id)) continue;

            this.playerMap.delete(id);
            this.lobby.players.splice(i, 1);
            i--;
        }
    }
}