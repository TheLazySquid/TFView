import type { ChatMessage, G15Player, KillfeedEntry, Lobby, Player } from "$types/lobby";
import { GameMessages, GameRecieves } from "$types/messages";
import { join } from "path";
import Config from "../config";
import Socket from "../socket";
import Rcon from "./rcon";
import fs from "fs";
import { fakeLobby } from "src/fakedata/game";
import { fakeData } from "src/consts";

export default class GameMonitor {
    static logPath: string;
    static lobby: Lobby = { players: [], killfeed: [], chat: [] };
    static playerMap = new Map<string, Player>();
    static pollInterval = 1000;
    static logFile: Bun.BunFile;
    static readStart = 0;

    static init() {
        Socket.onConnect("game", (respond) => {
            respond(GameMessages.Initial, this.lobby);
        });

        Socket.on("game", GameRecieves.Chat, (msg) => {
            if(fakeData) this.addFakeMessage(msg, false);
            else Rcon.server.execute(`say ${msg}`);
        });

        Socket.on("game", GameRecieves.ChatTeam, (msg) => {
            if(fakeData) this.addFakeMessage(msg, true);
            else Rcon.server.execute(`say_team ${msg}`);
        });

        if(fakeData) {
            this.lobby = fakeLobby;
            return;
        }
        
        // watch the log for updates
        let logExists = false;
        this.logPath = join(Config.get("tf2Path"), "tf", "console.log");
        this.logFile = Bun.file(this.logPath);
        this.logFile.exists().then((exists) => logExists = exists);
        this.logFile.stat().then(s => this.readStart = s.size);

        // fs.watch can't be relied on for log updates, somehow the log
        // doesn't trigger whatever listeners this uses
        fs.watch(this.logPath, (type) => {
            if(type === "rename") {
                logExists = !logExists;
                if(!logExists) return;

                this.logFile.stat().then(s => this.readStart = s.size);
                return;
            }
        });

        setInterval(() => this.poll(), this.pollInterval);
    }

    static poll() {
        if(!Rcon.connected) return;

        Rcon.server.execute("g15_dumpplayer")
            .then((text) => {
                if(typeof text !== "string") return;
                this.parseG15(text);
            });

        this.logFile.stat().then(stat => {
            if(stat.size > this.readStart) this.readLog();
        });
    }

    static readLog() {
        const stream = fs.createReadStream(this.logPath, {
            start: this.readStart
        });

        let added = "";
        stream.once("data", (buffer) => added += buffer);
        stream.once("close", () => {
            this.readStart += added.length;
            this.parseLog(added)
        });
    }

    // Doesn't handle suicides
    static killfeedRegex = /(?:\n|^)(.+) killed (.+) with (.+)\.( \(crit\))?/g;
    static chatRegex = /(?:\n|^)(?:\*SPEC\* )?(\*DEAD\* ?)?(\(TEAM\) |\(Spectator\) )?(.+) :  (.+)/g;
    static parseLog(text: string) {
        let match: RegExpExecArray;

        // parse the killfeed
        while(match = this.killfeedRegex.exec(text)) {
            let killer = this.lobby.players.find(p => p.name === match[1]);
            if(!killer) continue;

            let entry: KillfeedEntry = {
                killer: match[1],
                victim: match[2],
                weapon: match[3],
                crit: match[4] !== undefined,
                killerTeam: killer.team
            }

            this.lobby.killfeed.push(entry);
            Socket.send("game", GameMessages.KillfeedAdded, entry);
        }

        // parse the chat
        while(match = this.chatRegex.exec(text)) {
            let player = this.lobby.players.find(p => p.name === match[3]);
            if(!player) continue;

            let message: ChatMessage = {
                dead: match[1] !== undefined,
                team: match[2] !== undefined,
                name: match[3],
                text: match[4],
                senderTeam: player.team
            }

            this.lobby.chat.push(message);
            Socket.send("game", GameMessages.ChatAdded, message);
        }
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

    
    static addFakeMessage(msg: string, team: boolean) {   
        let message: ChatMessage = {
            name: "You",
            senderTeam: 2,
            dead: false,
            team,
            text: msg
        }
        this.lobby.chat.push(message);
        Socket.send("game", GameMessages.ChatAdded, message);
    }
}