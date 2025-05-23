import type { ChatMessage, G15Player, KillfeedEntry, Lobby, Player } from "$types/lobby";
import type { PlayerEncounter } from "$types/data";
import { GameMessages, Recieves } from "$types/messages";
import Socket from "../socket";
import Rcon from "./rcon";
import { fakeData } from "src/consts";
import LogParser from "src/logParser";
import History from "src/history/history";
import { fakeLobby } from "src/fakedata/game";
import PlayerData from "./playerdata";
import Config from "src/config";

export default class GameMonitor {
    static logPath: string;
    static lobby: Lobby = { players: [], killfeed: [], chat: [] };
    static playerMap = new Map<string, Player>();
    static pollInterval = 1000;
    static readStart = 0;

    static init() {
        Socket.onConnect("game", (respond) => {
            respond(GameMessages.Initial, this.lobby);
        });

        Socket.on(Recieves.Chat, (msg) => {
            if(fakeData) this.addFakeMessage(msg, false);
            else Rcon.run(`say ${msg}`);
        });

        Socket.on(Recieves.ChatTeam, (msg) => {
            if(fakeData) this.addFakeMessage(msg, true);
            else Rcon.run(`say_team ${msg}`);
        });

        if(fakeData) {
            this.lobby = fakeLobby;
            let people = History.db.query<PlayerEncounter, []>(`SELECT * FROM encounters LIMIT ${this.lobby.players.length}`)
                .all();
            for(let i = 0; i < people.length; i++) {
                this.lobby.players[i].accountId = people[i].playerId;
            }
            return;
        }

        this.listenToLog();

        this.poll();
        History.events.on("startGame", () => {
            this.gotResponse = false;
        });
    }

    static gotResponse = false;
    static responseTime = 0;
    static async poll() {
        const runAgain = () => {
            setTimeout(() => this.poll(), this.pollInterval);
        }

        if(!Rcon.connected) return runAgain();

        // This can potentially take a long time when loading into a map
        let text = await Rcon.run("g15_dumpplayer");
        runAgain();

        // check if the game ended
        if(!text || text === "") {
            if(!History.currentGame) return;

            // Disconnect after a minute of no response, or 10 seconds after having recieved a response with no responses since
            // since the dumpplayer command will sometimes return empty when loading in
            const gameDuration = Date.now() - History.currentGame.start;
            const responseGap = Date.now() - this.responseTime;
            if(
                (!this.gotResponse && gameDuration >= 60e3) ||
                (this.gotResponse && responseGap >= 10e3)
            ) {
                History.onGameEnd();
            }

            return;
        }

        this.gotResponse = true;
        this.responseTime = Date.now();
        this.parseG15(text);
    }

    // Doesn't handle suicides
    static killfeedRegex = /(?:\n|^)(.+) killed (.+) with (.+)\.( \(crit\))?/g;
    static chatRegex = /(?:\n|^)(?:\*SPEC\* )?(\*DEAD\* ?)?(\(TEAM\) |\(Spectator\) )?(.+) :  (.+)/g;
    static listenToLog() {
        // parse the killfeed
        LogParser.on(this.killfeedRegex, (match) => {
            let killer = this.lobby.players.find(p => p.name === match[1]);
            if(!killer) return;

            let entry: KillfeedEntry = {
                killer: match[1],
                victim: match[2],
                weapon: match[3],
                crit: match[4] !== undefined,
                killerTeam: killer.team
            }

            this.lobby.killfeed.push(entry);
            Socket.send("game", GameMessages.KillfeedAdded, entry);
        });

        // parse the chat
        LogParser.on(this.chatRegex, (match) => {
            let player = this.lobby.players.find(p => p.name === match[3]);
            if(!player) return;

            let message: ChatMessage = {
                dead: match[1] !== undefined,
                team: match[2] !== undefined,
                name: match[3],
                text: match[4],
                senderTeam: player.team
            }

            this.lobby.chat.push(message);
            Socket.send("game", GameMessages.ChatAdded, message);
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
            if(id === "0" || id === undefined || playerInfo.szName === undefined) continue;
            
            let player: Partial<Player> = {};
            if(this.playerMap.has(id)) player = this.playerMap.get(id);

            let diff = this.updatePlayer(player, playerInfo);

            // dispatch the changes
            if(this.playerMap.has(id)) {
                if(diff) Socket.send("game", GameMessages.PlayerUpdate, diff);
            } else {
                // track the player in the game history
                if(!History.currentGame?.players.some(p => p.id === player.accountId)) {
                    History.currentGame?.players.push({
                        id: player.accountId,
                        name: player.name,
                        time: Date.now()
                    });
                }

                Socket.send("game", GameMessages.PlayerJoin, player as Player);
                this.lobby.players.push(player as Player);
                this.playerMap.set(id, player as Player);

                // These are almost certainly tfbots
                if(!Config.get("steamApiKey") || player.accountId.length <= 2) continue;

                PlayerData.getSummary(player.accountId).then((summary) => {
                    player.avatarHash = summary.avatarHash;
                    player.createdTimestamp = summary.createdTimestamp;
                    Socket.send("game", GameMessages.PlayerUpdate, {
                        userId: player.userId,
                        ...summary
                    });
                });
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
            if(value === undefined || player[key] === value) return;

            diff[key] = value;
            player[key] = value;
            changed = true;
        }

        copy("accountId", info.iAccountID);
        copy("userId", info.iUserID);
        copy("name", info.szName);
        copy("ping", parseInt(info.iPing));
        copy("team", parseInt(info.iTeam));
        copy("health", parseInt(info.iHealth));
        if(info.bAlive !== undefined) copy("alive", info.bAlive === "true");

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