import type { G15Player, Lobby, Player } from "$types/lobby";
import { GameMessages } from "$types/messages";
import Socket from "../socket";
import Rcon from "./rcon";

export default class GameMonitor {
    static lobby: Lobby = { players: [] };
    static playerMap = new Map<string, Player>();
    static pollInterval = 1000;

    static init() {
        setInterval(() => this.poll(), this.pollInterval);

        Socket.onConnect("game", (ws) => {
            ws.send(GameMessages.Initial + JSON.stringify(this.lobby.players));
        });
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
        let info: Partial<G15Player>[] = [];
        for(let i = 0; i <= 101; i++) info.push({});

        let match: RegExpExecArray;
        while(match = this.g15Regex.exec(text)) {
            let index = parseInt(match[2]);
            info[index][match[1]] = match[3];
        }

        const ids = new Set<string>();

        // add/update players
        for(let i = 0; i <= 101; i++) {
            const playerInfo = info[i] as G15Player;
            const id = playerInfo.iUserID;
            ids.add(id);
            if(id === "0" || id === undefined) continue;
            
            let player: Partial<Player> = {};
            if(this.playerMap.has(id)) player = this.playerMap.get(id);

            let diff = this.updatePlayer(player, playerInfo);

            // dispatch the changes
            if(this.playerMap.has(id)) {
                if(diff) Socket.send("game", GameMessages.PlayerUpdate, diff);
            } else {
                Socket.send("game", GameMessages.PlayerJoin, player as Player);
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

            // dispatch the change
            Socket.send("game", GameMessages.PlayerLeave, id);
        }
    }

    static updatePlayer(player: Partial<Player>, info: G15Player) {
        let diff = { userId: info.iUserID };
        let changed = false;
        
        const copy = (key: string, value: any) => {
            if(player[key] === value) return;

            diff[key] = value;
            player[key] = value;
            changed = true;
        }

        copy("accountId", info.iAccountID);
        copy("userId", info.iUserID);
        copy("name", info.szName);
        copy("alive", info.bAlive === "true");
        copy("ping", parseInt(info.iPing));
        copy("team", parseInt(info.iTeam));
        copy("health", parseInt(info.iHealth));

        if(!changed) return null;
        return diff;
    }
}