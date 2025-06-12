import type { ChatMessage, G15Player, KillfeedEntry, Lobby, Player, TF2Class } from "$types/lobby";
import type { PlayerEncounter } from "$types/data";
import { Recieves, Message } from "$types/messages";
import Socket from "../socket";
import Rcon from "./rcon";
import { fakeData } from "src/consts";
import LogParser from "src/logParser";
import History from "src/history/history";
import { fakeLobby } from "src/fakedata/game";
import PlayerData from "./playerdata";
import Settings from "src/settings/settings";
import { maxKillfeedSize } from "$shared/consts";
import { killClasses, startingAmmo, startingHealths } from "./classConsts";
import fsp from "fs/promises";
import { join } from "path";
import getActiveUser from "$shared/getActiveUser";
import { id3ToId64 } from "$shared/steamid";

export default class GameMonitor {
    static logPath: string;
    static potentialClasses = new Map<string, TF2Class[]>();
    static userAccountID3 = "";
    static lobby: Lobby = { players: [], killfeed: [], chat: [] };
    static playerMap = new Map<string, Player>();
    static pollInterval = 1000;
    static readStart = 0;

    static init() {
        Socket.onConnect("game", (respond) => {
            respond(Message.InitialGame, this.lobby);
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
                this.lobby.players[i].ID3 = people[i].playerId;
            }
            return;
        }

        const path = join(Settings.get("steamPath"), "config", "loginusers.vdf");

        // TODO: Error handling
        fsp.readFile(path).then((loginusers) => {
            this.userAccountID3 = getActiveUser(loginusers.toString());
        });

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
            let victim = this.lobby.players.find(p => p.name === match[2]);
            if(!killer || !victim) return;

            let entry: KillfeedEntry = {
                killer: match[1],
                victim: match[2],
                weapon: match[3],
                crit: match[4] !== undefined,
                killerTeam: killer.team,
                killerId: killer.userId,
                victimId: victim.userId
            }

            this.lobby.killfeed.push(entry);
            if(this.lobby.killfeed.length > maxKillfeedSize) this.lobby.killfeed.shift();
            Socket.send("game", Message.KillfeedAdded, entry);

            killer.kills++;
            victim.deaths++;

            let killerUpdate: Partial<Player> & { userId: string } = { userId: killer.userId, kills: killer.kills };

            // See if we can guess the player's class
            const classes = killClasses[match[3]];
            if(classes) {
                const options = this.potentialClasses.get(killer.userId);

                if(classes.length === 1) {
                    killer.class = classes[0];
                    killerUpdate.class = classes[0];

                    // Quick sanity check
                    if(options && !options.includes(classes[0])) {
                        this.potentialClasses.delete(killer.userId);
                    }
                } else if(options) {
                    let possibilities: TF2Class[] = [];

                    for(let option of options) {
                        if(classes.includes(option)) possibilities.push(option);
                    }

                    // Clearly our current options are no good
                    if(possibilities.length === 0) this.potentialClasses.delete(killer.userId);
                    else if(possibilities.length === 1) {
                        killer.class = possibilities[0];
                        killerUpdate.class = possibilities[0];
                    }
                }
            }

            Socket.send("game", Message.PlayerUpdate, killerUpdate);
            Socket.send("game", Message.PlayerUpdate, { userId: victim.userId, deaths: victim.deaths });
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
                senderTeam: player.team,
                senderId: player.userId
            }

            this.lobby.chat.push(message);
            Socket.send("game", Message.ChatAdded, message);
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
            
            let player: Partial<Player> = { kills: 0, deaths: 0 };
            if(playerInfo.iAccountID === this.userAccountID3) player.user = true;
            if(this.playerMap.has(id)) player = this.playerMap.get(id);

            let diff = this.updatePlayer(player, playerInfo);

            // dispatch the changes
            if(this.playerMap.has(id)) {
                if(diff) Socket.send("game", Message.PlayerUpdate, diff);
            } else {
                // track the player in the game history
                if(!History.currentGame?.players.some(p => p.id === player.ID3)) {
                    History.currentGame?.players.push({
                        id: player.ID3,
                        name: player.name,
                        time: Date.now()
                    });
                }

                Socket.send("game", Message.PlayerJoin, player as Player);
                this.lobby.players.push(player as Player);
                this.playerMap.set(id, player as Player);

                // These are almost certainly tfbots
                if(!Settings.get("steamApiKey") || player.ID3.length <= 2) continue;

                PlayerData.getSummary(player.ID3)
                    .then((summary) => {
                        player.avatarHash = summary.avatarHash;
                        player.createdTimestamp = summary.createdTimestamp;
                        Socket.send("game", Message.PlayerUpdate, {
                            userId: player.userId,
                            ...summary
                        });
                    })
                    .catch();
            }
        }

        // remove players that have left
        for(let i = 0; i < this.lobby.players.length; i++) {
            const id = this.lobby.players[i].userId;
            if(ids.has(id)) continue;

            this.playerMap.delete(id);
            this.potentialClasses.delete(id);
            this.lobby.players.splice(i, 1);
            i--;

            // dispatch the change
            Socket.send("game", Message.PlayerLeave, id);
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

        // Check if the person just respawned, and then try to infer what class they might be on
        const health = parseInt(info.iHealth);
        if(player.alive === false && info.bAlive === "true") {
            const healthClasses = startingHealths[health];
            const ammoClasses = startingAmmo[parseInt(info.iAmmo)];

            let potentialClasses: TF2Class[] = [];
            if(healthClasses && ammoClasses) {
                // Get all classes that satisfy both
                for(let tfclass of healthClasses) {
                    if(ammoClasses.includes(tfclass)) {
                        potentialClasses.push(tfclass);
                    }
                }
            }
            else if(healthClasses) potentialClasses = healthClasses;
            else if(ammoClasses) potentialClasses = ammoClasses;

            if(potentialClasses.length === 1) copy("class", potentialClasses[0]);
            else if(potentialClasses.length > 0) {
                this.potentialClasses.set(info.iUserID, potentialClasses);
                // Check whether the current class makes sense
                if(typeof player.class === "number" && !potentialClasses.includes(player.class)) {
                    copy("class", null);
                }
            }
        }

        copy("ID3", info.iAccountID);
        copy("ID64", id3ToId64(info.iAccountID));
        copy("userId", info.iUserID);
        copy("name", info.szName);
        copy("ping", parseInt(info.iPing));
        copy("team", parseInt(info.iTeam));
        copy("health", health);
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
            text: msg,
            senderId: "1"
        }
        this.lobby.chat.push(message);
        Socket.send("game", Message.ChatAdded, message);
    }
}