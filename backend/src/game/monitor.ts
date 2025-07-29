import type { ChatMessage, G15Player, KillfeedEntry, Player, PlayerSummary, TF2Class } from "$types/lobby";
import type { ChatSearchParams, KillfeedSearchParams } from "$types/search";
import { Recieves, Message } from "$types/messages";
import Server, { type WS } from "../net/server";
import Rcon from "./rcon";
import { flags } from "src/consts";
import LogParser from "src/logParser";
import History from "src/history/history";
import PlayerData from "./playerdata";
import { killClasses, possibleMaxHps, startingAmmo, startingHealths } from "./classConsts";
import { id3ToId64 } from "$shared/steamid";
import HistoryDatabase from "src/history/database";
import { fakeChat, fakeKillfeed, fakePlayers } from "src/fakedata/game";
import { LoadedInfiniteList } from "src/net/infiniteList";
import { getCurrentUserId } from "src/util";

export default class GameMonitor {
    static logPath: string;
    static potentialClasses = new Map<string, TF2Class[]>();
    static userAccountID3 = "";
    static players: Player[] = [];
    static playerMap = new Map<string, Player>();
    static missedQueries = new Map<string, number>();
    static pollInterval = 1000;
    static readStart = 0;
    static killfeed = new LoadedInfiniteList<KillfeedEntry, KillfeedSearchParams>({
        topic: "game",
        listId: "killfeed",
        filter: (item, params) => {
            if(!params.id) return true;
            if(params.type === "kill") return item.killerId === params.id;
            if(params.type === "death") return item.victimId === params.id;
            else return item.killerId === params.id || item.victimId === params.id;
        },
        getParamsId: (params) => (params.id ?? "") + params.type,
        reverse: true
    });
    static chat = new LoadedInfiniteList<ChatMessage, ChatSearchParams>({
        topic: "game",
        listId: "chat",
        filter: (item, params) => !params.id || item.senderId === params.id,
        getParamsId: (params) => params.id ?? "",
        reverse: true
    });

    static init() {
        Server.onConnect("game", (respond) => {
            respond(Message.InitialPlayers, this.players);
        });

        Server.on(Recieves.Chat, (msg) => {
            if(flags.fakeData) this.addFakeMessage(msg, false);
            else Rcon.run(`say ${msg}`);
        });

        Server.on(Recieves.ChatTeam, (msg) => {
            if(flags.fakeData) this.addFakeMessage(msg, true);
            else Rcon.run(`say_team ${msg}`);
        });

        const updatePlayerData = (ws: WS, id: string, key: "nickname" | "note", value: string) => {
            HistoryDatabase.setPlayerUserData(id, key, value);

            let player = this.players.find(p => p.ID3 === id);
            if(!player) return;
            player[key] = value;

            Server.sendOthers(ws, "game", Message.PlayerUpdate, {
                ID3: player.ID3,
                [key]: value
            });
        }

        Server.on(Recieves.SetNickname, ({ id, nickname }, { ws }) => {
            updatePlayerData(ws, id, "nickname", nickname);
        });

        Server.on(Recieves.SetNote, ({ id, note }, { ws }) => {            
            updatePlayerData(ws, id, "note", note);
        });

        Server.on(Recieves.SetTags, ({ id, tags }, { ws }) => {
            HistoryDatabase.setPlayerTags(id, tags);

            let player = this.players.find(p => p.ID3 === id);
            if(!player) return;
            player.tags = tags;

            Server.sendOthers(ws, "game", Message.PlayerUpdate, {
                ID3: player.ID3,
                tags
            });
        });

        if(flags.fakeData) {
            this.players = fakePlayers;
            this.killfeed.items = fakeKillfeed;
            this.chat.items = fakeChat;

            return;
        }

        // TODO: Error handling
        getCurrentUserId().then((id3) => this.userAccountID3 = id3);

        this.listenToLog();
        this.poll();

        History.events.on("startGame", () => {
            this.gotResponse = false;
        });
        
        // When the game ends make all players ready to be removed
        // Since odds are most will leave before the next game starts
        History.events.on("endGame", () => {
            for(let player of this.players) {
                this.missedQueries.set(player.ID3, 3);
            }
        });
    }

    static runTimeout: Timer;
    static closed = false;
    static close() {
        this.closed = true;
        if(this.runTimeout) clearTimeout(this.runTimeout);
    }

    static gotResponse = false;
    static responseTime = 0;
    static async poll() {
        const runAgain = () => {
            if(this.closed) return;
            this.runTimeout = setTimeout(() => this.poll(), this.pollInterval);
        }

        if(!Rcon.connected) return runAgain();

        // This can potentially take a long time when loading into a map
        let text = await Rcon.run("g15_dumpplayer", 5000);
        runAgain();

        // check if the game ended
        if(!text || text === "") {
            if(!History.currentGame) return;

            // Disconnect after a minute of no response, or 10 seconds after having recieved a response with no responses since
            // since the dumpplayer command will sometimes return empty when loading in
            const gameDuration = Date.now() - History.currentGame.startTime;
            const responseGap = Date.now() - this.responseTime;
            if(
                (!this.gotResponse && gameDuration >= 60e3) ||
                (this.gotResponse && responseGap >= 10e3)
            ) {
                History.onGameEnd();
            }

            return;
        }

        // If we've got a response we're in a game, if we never detected that (such as if tfview was turned on mid-game)
        // Then send the status command to figure out where we are. Only works in casual for some reason.
        if(!History.currentGame) Rcon.run("status");

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
            let killer = this.players.find(p => p.name === match[1]);
            let victim = this.players.find(p => p.name === match[2]);
            if(!killer || !victim) return;

            let entry: KillfeedEntry = {
                killer: match[1],
                victim: match[2],
                weapon: match[3],
                crit: match[4] !== undefined,
                killerTeam: killer.team,
                killerId: killer.ID3,
                victimId: victim.ID3,
                timestamp: Date.now()
            }

            this.killfeed.push(entry);

            // Deaths are handled in the player update
            killer.killstreak++;
            let message: Partial<Player> & { ID3: string } = { ID3: killer.ID3, killstreak: killer.killstreak };

            // See if we can guess the player's class
            const classes = killClasses[match[3]];
            if(classes) {
                const options = this.potentialClasses.get(killer.ID3);

                if(classes.length === 1) {
                    killer.class = classes[0];

                    // Quick sanity check
                    if(options && !options.includes(classes[0])) {
                        this.potentialClasses.delete(killer.ID3);
                    }

                    message.class = classes[0];
                } else if(options) {
                    let possibilities: TF2Class[] = [];

                    for(let option of options) {
                        if(classes.includes(option)) possibilities.push(option);
                    }

                    // Clearly our current options are no good
                    if(possibilities.length === 0) this.potentialClasses.delete(killer.ID3);
                    else if(possibilities.length === 1) {
                        killer.class = possibilities[0];
                        message.class = possibilities[0];
                    }
                }
            }

            Server.send("game", Message.PlayerUpdate, message);
        });

        // parse the chat
        LogParser.on(this.chatRegex, (match) => {
            let player = this.players.find(p => p.name === match[3]);
            if(!player) return;

            let message: ChatMessage = {
                dead: match[1] !== undefined,
                team: match[2] !== undefined,
                name: match[3],
                text: match[4],
                senderTeam: player.team,
                senderId: player.ID3,
                timestamp: Date.now()
            }

            this.chat.push(message);
        });
    }

    static g15Regex = /m_(.+)\[(\d+)\] \S+ \((.+)\)(?:\n|$)/g;
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
            const playerInfo = info[i];
            const id = playerInfo.iAccountID;
            ids.add(id);
            if(playerInfo.iUserID === "0" || id === undefined || playerInfo.szName === undefined) continue;
            
            this.missedQueries.delete(id);
            
            let player: Partial<Player> = {
                kills: 0,
                deaths: 0,
                tags: {},
                killstreak: 0
            }

            if(playerInfo.iAccountID === this.userAccountID3) player.user = true;
            if(this.playerMap.has(id)) player = this.playerMap.get(id);

            let diff = this.updatePlayer(player, playerInfo);

            // dispatch the changes
            if(this.playerMap.has(id)) {
                if(!diff) continue;

                // Reset the killstreak when dying/respawning
                if(diff.alive !== undefined || diff.team !== undefined) {
                    player.killstreak = 0;
                    diff.killstreak = 0;
                }
                
                Server.send("game", Message.PlayerUpdate, diff);

                if(diff.name) {
                    History.updatePlayerName(player.ID3, diff.name);
                }
            } else {
                // Get any stored user-generated data
                const playerData = HistoryDatabase.getPlayerData(player.ID3);
                if(playerData) {
                    if(playerData.tags) player.tags = playerData.tags;
                    if(playerData.nickname) player.nickname = playerData.nickname;
                    if(playerData.note) player.note = playerData.note;
                    if(playerData.encounters) player.encounters = playerData.encounters;
                    player.names = playerData.names ?? [];
                    if(!player.names.includes(player.name)) {
                        player.names.push(player.name);
                    }
                }

                // track the player in the game history
                History.onJoin(player as Player);

                Server.send("game", Message.PlayerJoin, player as Player);
                this.players.push(player as Player);
                this.playerMap.set(id, player as Player);

                // These are almost certainly tfbots
                if(player.ID3.length <= 2) continue;

                const summaryCallback = (summary: PlayerSummary) => {
                    player.avatarHash = summary.avatarHash;
                    player.createdTimestamp = summary.createdTimestamp;
                    if(summary.name && summary.name !== player.name) {
                        player.name = summary.name;
                        History.updatePlayerName(player.ID3, summary.name);
                    }

                    Server.send("game", Message.PlayerUpdate, {
                        ID3: player.ID3,
                        ...summary
                    });
                }

                if(player.user) PlayerData.getUserSummary(player.ID3, summaryCallback);
                else PlayerData.getSummary(player.ID3, summaryCallback);
            }
        }

        // remove players that have left
        let playersLeft = false;
        for(let i = 0; i < this.players.length; i++) {
            const id = this.players[i].ID3;
            if(ids.has(id)) continue;

            // Allow the player to be missing up to 3 times before removing them
            // Since for some reason dumpplayer will randomly not return some players
            let missingFor = this.missedQueries.get(id) ?? 0;
            if(missingFor < 3) {
                this.missedQueries.set(id, missingFor + 1);
                continue;
            }

            this.playerMap.delete(id);
            this.potentialClasses.delete(id);
            this.missedQueries.delete(id);
            this.players.splice(i, 1);
            playersLeft = true;
            i--;

            // dispatch the change
            Server.send("game", Message.PlayerLeave, id);
        }

        if(playersLeft) this.pruneOldEntries();
    }

    static pruneOldEntries() {
        const start = 5000;

        // remove old chat messages
        for(let i = start; i < this.chat.items.length; i++) {
            if(!this.playerMap.has(this.chat.items[i].senderId)) {
                this.chat.items.splice(i, 1);
                i--;
            }
        }

        // remove old killfeed entries
        for(let i = start; i < this.killfeed.items.length; i++) {
            const entry = this.killfeed.items[i];
            if(!this.playerMap.has(entry.killerId) && !this.playerMap.has(entry.victimId)) {
                this.killfeed.items.splice(i, 1);
                i--;
            }
        }
    }

    static updatePlayer(player: Partial<Player>, info: Partial<G15Player>) {
        let diff: Partial<Player> & { ID3: string } = { ID3: info.iAccountID };
        let changed = false;
        
        const copy = (key: string, value: any) => {
            if(typeof value === "number" && isNaN(value)) return;
            if(value === undefined || player[key] === value) return;

            diff[key] = value;
            player[key] = value;
            changed = true;
        }

        // Check if the person just respawned, and then try to infer what class they might be on
        // And also guess their max hp for the healthbar in the frontend
        const health = parseInt(info.iHealth);
        if(player.alive === false && info.bAlive === "true") {
            // Guess the player's max health
            let bestDistance = Infinity;
            let maxHealth = 0;
            for(let max of possibleMaxHps) {
                let distance = Math.abs(health - max);
                if(distance < bestDistance) {
                    bestDistance = distance;
                    maxHealth = max;
                }
            }

            copy("maxHealth", maxHealth);

            // Try to guess their class
            const healthClasses = startingHealths[health];

            // This will be undefined in casual, but it seems to work fine in private servers
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
                this.potentialClasses.set(info.iAccountID, potentialClasses);
                // Check whether the current class makes sense
                if(typeof player.class === "number" && !potentialClasses.includes(player.class)) {
                    copy("class", null);
                }
            }
        }

        // Don't name the person "unconnected" if they already have a name, eg from the steam api or history
        // Again this raises issues if a person renames themselves to "unconnected" mid-game
        // But this is such a rare edge case that it doesn't matter
        if(info.szName !== "unconnected" || !player.name) {
            copy("name", info.szName);
        }

        copy("ID3", info.iAccountID);
        copy("ID64", id3ToId64(info.iAccountID));
        copy("userId", info.iUserID);
        copy("ping", parseInt(info.iPing));
        copy("team", parseInt(info.iTeam));
        copy("health", health);
        copy("kills", parseInt(info.iScore));
        copy("deaths", parseInt(info.iDeaths));
        if(info.bAlive !== undefined) copy("alive", info.bAlive === "true");

        // Update the k/d of the saved user if it changed
        if(History.currentGame && (diff.kills !== undefined || diff.deaths !== undefined)) {
            History.updatePlayer(player as Player);
        }

        if(!changed) return null;
        return diff;
    }
    
    static addFakeMessage(msg: string, team: boolean) {   
        let message: ChatMessage = {
            name: this.players[0].name,
            senderTeam: this.players[0].team,
            dead: false,
            team,
            text: msg,
            senderId: this.players[0].ID3,
            timestamp: Date.now()
        }
        this.chat.push(message);
    }
}