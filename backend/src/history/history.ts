import type { PastGamePlayer } from "$types/data";
import type { Player } from "$types/lobby";
import { Message, Recieves } from "$types/messages";
import { flags } from "src/consts";
import LogParser from "src/logParser";
import Server from "src/net/server";
import EventEmitter from "node:events";
import Log from "src/log";
import Rcon from "src/game/rcon";
import { fakeCurrentGame } from "src/fakedata/game";
import HistoryDatabase from "./database";
import Demos from "./demos";
import GameMonitor from "src/game/monitor";

export interface CurrentGame {
    map: string;
    startTime: number;
    players: PastGamePlayer[];
    rowid: number;
    kills: number;
    deaths: number;
    hostname?: string;
    ip?: string;
    demos: string[];
}

interface CurrentPlayer {
    info: PastGamePlayer;
    rowid: number;
}

export default class History {
    static currentGame: CurrentGame | null = null;
    static currentPlayers = new Map<string, CurrentPlayer>();
    static gamesFile: Bun.BunFile;
    static pastGamesDir: string;
    static pageSize = 50;
    static events = new EventEmitter();
    static updateInterval: Timer;
    static updateIntervalTime = 10000;
    static definitelyNotInGame = false;

    static init() {        
        Server.onConnect("game", (send) => {
            send(Message.CurrentServer, {
                server: this.getCurrentServer(),
                definitelyNotInGame: this.definitelyNotInGame
            });
        });

        Server.on(Recieves.DeleteGame, (rowid, { reply }) => {
            // Prevent deleting the current game
            if(this.currentGame?.rowid === rowid) {
                reply("Unable to delete the game as it is currently being played.");
                return;
            }

            HistoryDatabase.deleteGame(rowid);
            reply(true);

            Log.info("Deleted game with rowid", rowid);
        });

        if(flags.fakeData) {
            this.currentGame = fakeCurrentGame;
            return;
        }

        this.listenToLog();
        Demos.events.on("create", (name) => this.addDemo(name));

        this.updateInterval = setInterval(() => {
            this.updateCurrentGame();
        }, this.updateIntervalTime);
    }

    static close() {
        clearInterval(this.updateInterval);
    }

    static getCurrentServer() {
        if(!this.currentGame) return null;
        return {
            start: this.currentGame.startTime,
            map: this.currentGame.map,
            hostname: this.currentGame.hostname,
            ip: this.currentGame.ip
        }
    }

    static mapChangeRegex = /(?:\n|^)Team Fortress\r?\nMap: (.+)/g;
    static statusRegex = /(?:\n|^)hostname: (.+)\n.*\nudp\/ip  : (.+)\n.*\n.*\nmap     : (.+) at:/g;
    static listenToLog() {
        LogParser.on(this.mapChangeRegex, async (data) => {
            this.onGameEnd();

            // If ds_status is empty we're replaying a demo
            // This is only needed here since status does not work in demos
            let status = await Rcon.run("ds_status");
            if(status === "") {
                Log.info("Demo playback detected, not starting game");
                return;
            }

            this.startGame(data[1]);

            // Figure out hostname and ip
            Rcon.run("status");
        });

        LogParser.on(this.statusRegex, (data) => {      
            let [_, hostname, ip, map] = data;
            
            if(!this.currentGame) this.startGame(map, hostname, ip);

            // update the current game to include hostname/ip
            if(hostname === this.currentGame.hostname && ip === this.currentGame.ip) return; 

            this.currentGame.hostname = hostname;
            this.currentGame.ip = ip;
            Server.send("game", Message.CurrentServer, { server: this.getCurrentServer(), definitelyNotInGame: false });

            HistoryDatabase.updateCurrentHostname(this.currentGame);
            Log.info("Updated server with ip", ip, "hostname", hostname);
        });
    }

    static startGame(map: string, hostname?: string, ip?: string) {
        if(this.currentGame) return;
        this.currentGame = {
            map, hostname, ip,
            startTime: Date.now(),
            players: [], demos: [],
            rowid: 0, kills: 0, deaths: 0
        }

        this.definitelyNotInGame = false;
        this.currentGame.rowid = HistoryDatabase.createCurrentGame(this.currentGame);
        this.events.emit("startGame");

        // Track the players currently in game
        for(let player of GameMonitor.players) {
            this.addPlayer(player);
        }
        this.updateCurrentGame();

        if(hostname) Log.info("Game started:", map, hostname, ip);
        else Log.info("Game started:", map, "(hostname pending)");

        Server.send("game", Message.CurrentServer, { server: this.getCurrentServer(), definitelyNotInGame: false });
    }

    static updateCurrentGame() {
        if(!this.currentGame) return;
        HistoryDatabase.updateCurrentGame(this.currentGame);
    }

    static addDemo(name: string) {
        if(!this.currentGame) return;
        this.currentGame.demos.push(name);

        HistoryDatabase.updateCurrentDemos(this.currentGame);
    }

    static addPlayer(player: Player) {
        if(player.user) return;
        if(this.currentGame.players.some(p => p.id === player.ID3)) return;

        const now = Date.now();
        let playerInfo: PastGamePlayer = {
            id: player.ID3,
            name: player.name,
            time: now,
            kills: player.kills,
            deaths: player.deaths
        }
        this.currentGame.players.push(playerInfo);

        // Don't record encounters with ourself
        if(player.user) return;
        let rowid = HistoryDatabase.recordPlayerEncounter(player, this.currentGame);

        this.currentPlayers.set(player.ID3, { info: playerInfo, rowid });
    }

    static updatePlayer(player: Player) {
        if(typeof player.kills !== "number" || typeof player.deaths !== "number") return;

        if(player.user) {
            this.currentGame.kills = player.kills;
            this.currentGame.deaths = player.deaths;

            HistoryDatabase.pastGames.update(this.currentGame.rowid, {
                kills: this.currentGame.kills,
                deaths: this.currentGame.deaths
            });
        } else {
            if(!this.currentPlayers.has(player.ID3)) return;
            let { rowid, info } = this.currentPlayers.get(player.ID3);
    
            info.kills = player.kills;
            info.deaths = player.deaths;
    
            HistoryDatabase.updatePlayerEncounter(rowid, info);
        }
    }

    static onJoin(player: Player) {
        // Don't record bots (Technically there's 100 people who this won't track, but they're all valve employees so I don't care)
        // This does raise the question of what if someone with id 1 joins a game with a bot, will they have the same id?
        if(player.ID3.length <= 2 || !this.currentGame) return;

        this.addPlayer(player);
        this.updateCurrentGame();
    }

    static updatePlayerName(id3: string, name: string) {
        if(!this.currentGame || !this.currentPlayers.has(id3)) return;

        let player = this.currentPlayers.get(id3);
        if(!player) return;

        player.info.name = name;
        HistoryDatabase.updatePlayerName(id3, name);
        HistoryDatabase.updatePlayerEncounterName(player.rowid, name);
    }

    static onGameEnd() {
        if(!this.currentGame || flags.fakeData) return;

        this.definitelyNotInGame = true;
        Server.send("game", Message.CurrentServer, { server: null, definitelyNotInGame: true });
        this.events.emit("endGame");
        this.updateCurrentGame();
        
        Log.info(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
        this.currentPlayers.clear();
    }
}