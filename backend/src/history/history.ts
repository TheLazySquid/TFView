import type { Stored, PastGame, PastGameEntry, PlayerEncounter, PastGamePlayer, StoredPlayer } from "$types/data";
import type { Player } from "$types/lobby";
import { Recieves, Message } from "$types/messages";
import { fakeData } from "src/consts";
import LogParser from "src/logParser";
import Server from "src/net/server";
import { Database } from "bun:sqlite";
import EventEmitter from "node:events";
import Log from "src/log";
import Rcon from "src/game/rcon";
import { fakeCurrentGame } from "src/fakedata/game";
import { createDatabase } from "./database";
import { InfiniteList } from "src/net/infiniteList";

export interface CurrentGame {
    map: string;
    startTime: number;
    players: PastGamePlayer[];
    rowid: number;
    kills: number;
    deaths: number;
    hostname?: string;
    ip?: string;
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
    static db: Database;
    static pageSize = 50;
    static events = new EventEmitter();
    static updateInterval = 10000;
    static pastGames: InfiniteList<PastGameEntry>;
    static pastPlayers: InfiniteList<StoredPlayer>;

    static init() {
        this.pastGames = new InfiniteList({
            topic: "gamehistory",
            listId: "pastgames",
            getBatch: (offset) => this.getGames(offset),
            getTotal: () => this.countGames()
        });

        this.pastPlayers = new InfiniteList({
            topic: "playerhistory",
            listId: "pastplayers",
            getBatch: (offset) => this.getPlayers(offset),
            getTotal: () => this.countPlayers()
        });

        Server.on(Recieves.GetGame, (rowid, { reply }) => {
            reply(this.getGame(rowid));
        });

        Server.on(Recieves.GetEncounters, ({ id, offset }, { reply }) => {
            let encounters = this.getEncounters(id, offset);
            if(offset === 0) {
                let count = this.countEncounters(id);
                reply({ encounters, total: count });
            } else {
                reply({ encounters });
            }
        });
        
        Server.onConnect("game", (send) => {
            if(!this.currentGame) return;
            send(Message.CurrentServer, this.getCurrentServer());
        });

        this.db = createDatabase();

        if(fakeData) {
            this.currentGame = fakeCurrentGame;
            return;
        }

        this.listenToLog();

        setInterval(() => {
            this.updateCurrentGame();
        }, this.updateInterval);
    }

    static getCurrentServer() {
        return {
            start: this.currentGame.startTime,
            map: this.currentGame.map,
            hostname: this.currentGame.hostname,
            ip: this.currentGame.ip 
        }
    }

    static getPlayerUserData(id: string) {
        return this.db.query<StoredPlayer | null, {}>(`SELECT * FROM players WHERE id = $id`).get({ $id: id });
    }

    static setPlayerUserData(id: string, key: "nickname" | "note" | "tags", value: string) {
        if(!this.getPlayerUserData(id)) {
            this.db.query(`INSERT INTO players (id, lastSeen) VALUES($id, $lastSeen)`)
                .run({ $id: id, $lastSeen: Date.now() });
        }

        this.db.query(`UPDATE players SET ${key} = $value WHERE id = $id`).run({
            $value: value,
            $id: id
        });

        this.pastPlayers.update(id, { [key]: value });
    }

    static saveAvatar(id: string, avatarHash: string) {
        try {
            this.db.query(`UPDATE players SET avatarHash = $avatarHash WHERE id = $id`).run({
                $id: id,
                $avatarHash: avatarHash
            });

            this.pastPlayers.update(id, { avatarHash });
        } catch {
            Log.error("Tried to save the avatar of a player that doesn't exist");
        }
    }
    
    static countGames(): number {
        let val = this.db.query<{ "COUNT(1)": number }, []>(`SELECT COUNT(1) FROM games`).get();
        return val["COUNT(1)"];
    }

    static getGames(offset: number): PastGameEntry[] {
        return this.db.query<PastGameEntry, {}>(`SELECT start, duration, map, hostname, ip, kills, deaths, rowid FROM games
            ORDER BY start DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $offset: offset });
    }

    static getGame(id: number) {
        let game = this.db.query<Stored<PastGame>, {}>(`SELECT * FROM games WHERE rowid = $rowid`)
            .get({ $rowid: id });
        return { ...game, players: JSON.parse(game.players) }
    }

    static countEncounters(id: string): number {
        let val = this.db.query<{ "COUNT(1)": number }, {}>(`SELECT COUNT(1) FROM encounters
            WHERE playerId = $id`).get({ $id: id });
        return val["COUNT(1)"];
    }

    static getEncounters(id: string, offset: number): PlayerEncounter[] {
        return this.db.query<PlayerEncounter, {}>(`SELECT * FROM encounters WHERE playerId = $id
            ORDER BY time DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $id: id, $offset: offset });
    }

    static countPlayers(): number {
        let val = this.db.query<{ "COUNT(1)": number }, []>(`SELECT COUNT(1) FROM players`).get();
        return val["COUNT(1)"];
    }

    static getPlayers(offset: number): StoredPlayer[] {
        return this.db.query<StoredPlayer, {}>(`SELECT * FROM players
            ORDER BY lastSeen DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $offset: offset });
    }

    static mapChangeRegex = /(?:\n|^)Team Fortress\r?\nMap: (.+)/g;
    static statusRegex = /(?:\n|^)hostname: (.+)\n.*\nudp\/ip  : (.+)\n.*\n.*\nmap     : (.+) at:/g;
    static listenToLog() {
        LogParser.on(this.mapChangeRegex, (data) => {
            this.onGameEnd();

            this.startGame(data[1]);
            // Figure out hostname and ip
            Rcon.run("status");
        });

        LogParser.on(this.statusRegex, (data) => {      
            let [_, hostname, ip, map] = data;
            
            if(!this.currentGame) this.startGame(map, hostname, ip);

            // update the current game to include hostname/ip
            if(!this.currentGame.hostname) {
                this.db.query(`UPDATE games SET hostname = $hostname, ip = $ip WHERE rowid = $rowid`).run({
                    $hostname: hostname,
                    $ip: ip,
                    $rowid: this.currentGame.rowid
                });
  
                this.pastGames.update(this.currentGame.rowid, { hostname, ip });              
                Log.info("Updated server with ip", ip, "hostname", hostname);
            }
        });
    }

    static startGame(map: string, hostname?: string, ip?: string) {
        this.currentGame = {
            map, hostname, ip,
            startTime: Date.now(),
            players: [],
            rowid: 0, kills: 0, deaths: 0
        }

        let val = this.db.query(`INSERT INTO games (map, hostname, ip, start, duration, players, kills, deaths)
            VALUES($map, $hostname, $ip, $start, $duration, $players, $kills, $deaths)`).run({
            $map: this.currentGame.map,
            $hostname: hostname,
            $ip: ip,
            $players: JSON.stringify(this.currentGame.players),
            $start: this.currentGame.startTime,
            $duration: 0, $kills: 0, $deaths: 0
        });

        this.currentGame.rowid = val.lastInsertRowid as number;

        this.events.emit("startGame");
        this.onGameStart();

        if(hostname) Log.info("Game started:", map, hostname, ip);
        else Log.info("Game started:", map, "(hostname pending)");

        Server.send("game", Message.CurrentServer, this.getCurrentServer());
        this.pastGames.addStart({
            start: this.currentGame.startTime,
            duration: 0,
            map: this.currentGame.map,
            hostname, ip,
            rowid: this.currentGame.rowid,
            kills: this.currentGame.kills,
            deaths: this.currentGame.deaths
        });
    }

    static updateCurrentGame() {
        if(!this.currentGame) return;

        this.db.query(`UPDATE games SET duration = $duration, players = $players,
            kills = $kills, deaths = $deaths WHERE rowid = $rowid`).run({
            $players: JSON.stringify(this.currentGame.players),
            $duration: Date.now() - this.currentGame.startTime,
            $kills: this.currentGame.kills,
            $deaths: this.currentGame.deaths,
            $rowid: this.currentGame.rowid
        });
    }

    static pendingPlayers: Player[] = [];
    static onGameStart() {
        if(this.pendingPlayers.length === 0) return;
        
        for(let player of this.pendingPlayers) {
            this.addPlayer(player);
        }

        this.updateCurrentGame();
    }

    static addPlayer(player: Player) {
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
        let val = this.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
            VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).run({
            $playerId: player.ID3,
            $map: this.currentGame.map,
            $name: player.name,
            $gameId: this.currentGame.rowid,
            $time: now,
            $kills: player.kills,
            $deaths: player.deaths
        });

        this.currentPlayers.set(player.ID3, {
            info: playerInfo,
            rowid: val.lastInsertRowid as number
        });

        if(this.getPlayerUserData(player.ID3)) {
            this.db.query(`UPDATE players SET lastSeen = $lastSeen, lastName = $lastName WHERE id = $id`)
                .run({ $lastSeen: now, $lastName: player.name, $id: player.ID3 });

            this.pastPlayers.update(player.ID3, { lastSeen: now, lastName: player.name });
        } else {
            this.db.query(`INSERT INTO players (id, lastSeen, lastName) VALUES($id, $lastSeen, $lastName)`)
                .run({ $lastSeen: now, $id: player.ID3, $lastName: player.name });

            this.pastPlayers.addStart({ id: player.ID3, lastName: player.name, lastSeen: now });
        }
    }

    static updatePlayer(player: Player) {
        if(player.user) {
            this.currentGame.kills = player.kills;
            this.currentGame.deaths = player.deaths;

            this.pastGames.update(this.currentGame.rowid, {
                kills: this.currentGame.kills,
                deaths: this.currentGame.deaths
            });
        } else {
            if(!this.currentPlayers.has(player.ID3)) return;
            let { rowid, info } = this.currentPlayers.get(player.ID3);
    
            info.kills = player.kills;
            info.deaths = player.deaths;
    
            // console.log("Updating", player.name, player)
            this.db.query(`UPDATE encounters SET kills = $kills, deaths = $deaths WHERE rowid = $rowid`).run({
                $kills: info.kills,
                $deaths: info.deaths,
                $rowid: rowid
            });
        }
    }

    static onJoin(player: Player) {
        // Don't record bots (Technically there's 100 people who this won't track, but they're all valve employees so I don't care)
        // This does raise the question of what if someone with id 1 joins a game with a bot, will they have the same id?
        if(player.ID3.length <= 2) return;

        if(!this.currentGame) {
            this.pendingPlayers.push(player);
            return;
        }

        this.addPlayer(player);
        this.updateCurrentGame();
    }

    static onGameEnd() {
        if(!this.currentGame || fakeData) return;

        Server.send("game", Message.CurrentServer, null);
        this.updateCurrentGame();
        
        Log.info(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
        this.currentPlayers.clear();
    }
}