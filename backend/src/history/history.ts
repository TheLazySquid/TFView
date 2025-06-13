import type { Stored, PastGame, PastGameEntry, PlayerEncounter, PastGamePlayer } from "$types/data";
import { Recieves, Message } from "$types/messages";
import { dataPath, fakeData } from "src/consts";
import LogParser from "src/logParser";
import Socket from "src/socket";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import fs from "fs";
import { createFakeHistory } from "src/fakedata/history";
import EventEmitter from "node:events";
import Log from "src/log";
import type { Player } from "$types/lobby";

interface CurrentGame {
    map: string;
    startTime: number;
    players: PastGamePlayer[];
    rowid: number;
}

export default class History {
    static currentGame: CurrentGame | null = null;
    static gamesFile: Bun.BunFile;
    static pastGamesDir: string;
    static db: Database;
    static pageSize = 50;
    static events = new EventEmitter();
    static updateInterval = 10000;

    static init() {
        Socket.on(Recieves.GetGames, (offset, { reply }) => {
            reply(this.getGames(offset));
        });

        Socket.on(Recieves.GetGame, (rowid, { reply }) => {
            reply(this.getGame(rowid));
        });

        Socket.on(Recieves.GetEncounters, ({ id, offset }, { reply }) => {
            reply(this.getEncounters(id, offset));
        })
        
        this.setupDb();

        if(fakeData) return;
        this.listenToLog();

        setInterval(() => {
            this.updateCurrentGame();
        }, this.updateInterval);
    }

    static setupDb() {
        let newDb = false;
        const dbPath = join(dataPath, fakeData ? "testhistory.sqlite" : "history.sqlite");
        if(fakeData && !fs.existsSync(dbPath)) newDb = true;

        this.db = new Database(dbPath);

        this.db.run(`CREATE TABLE IF NOT EXISTS main.games (
            map TEXT NOT NULL,
            start INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            players TEXT NOT NULL
        ); CREATE TABLE IF NOT EXISTS main.encounters (
            playerId TEXT NOT NULL,
            map TEXT NOT NULL,
            name TEXT NOT NULL,
            gameId INTEGER NOT NULL,
            time INTEGER NOT NULL
        )`);

        if(newDb) createFakeHistory(this.db);
    }

    static getGames(offset: number): PastGameEntry[] {
        return this.db.query<PastGameEntry, {}>(`SELECT start, duration, map, rowid FROM games
            ORDER BY start DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $offset: offset });
    }

    static getGame(id: number) {
        let game = this.db.query<Stored<PastGame>, {}>(`SELECT * FROM games WHERE rowid = $rowid`)
            .get({ $rowid: id });
        return { ...game, players: JSON.parse(game.players) }
    }

    static getEncounters(id: string, offset: number): PlayerEncounter[] {
        return this.db.query<PlayerEncounter, {}>(`SELECT * FROM encounters WHERE playerId = $id
            ORDER BY time DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $id: id, $offset: offset });
    }

    static mapChangeRegex = /(?:\n|^)Team Fortress\r?\nMap: (.+)/g;
    static statusMapRegex = /(?:\n|^)map     : (.+) at:/g;
    static listenToLog() {
        const onMapLoaded = (map: string) => {            
            this.currentGame = {
                map,
                startTime: Date.now(),
                players: [],
                rowid: 0
            }

            let val = this.db.query(`INSERT INTO games (map, start, duration, players)
                VALUES($map, $start, $duration, $players)`).run({
                $map: this.currentGame.map,
                $players: JSON.stringify(this.currentGame.players),
                $start: this.currentGame.startTime,
                $duration: 0
            });

            this.currentGame.rowid = val.lastInsertRowid as number;

            this.events.emit("startGame");
            this.onGameStart();

            Log.info("Game started:", map);
            Socket.send("history", Message.GameAdded, {
                start: this.currentGame.startTime,
                duration: 0,
                map: this.currentGame.map,
                rowid: this.currentGame.rowid
            });
        }

        LogParser.on(this.mapChangeRegex, (data) => {
            this.onGameEnd();

            onMapLoaded(data[1]);
        });

        LogParser.on(this.statusMapRegex, (data) => {
            if(this.currentGame) return;
            onMapLoaded(data[1]);
        });
    }

    static updateCurrentGame() {
        if(!this.currentGame) return;

        this.db.query(`UPDATE games SET duration = $duration, players = $players
            WHERE rowid = $rowid`).run({
            $players: JSON.stringify(this.currentGame.players),
            $duration: Date.now() - this.currentGame.startTime,
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
        const now = Date.now();
        this.currentGame.players.push({
            id: player.ID3,
            name: player.name,
            time: now
        });

        this.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time)
            VALUES($playerId, $map, $name, $gameId, $time)`).run({
            $playerId: player.ID3,
            $map: this.currentGame.map,
            $name: player.name,
            $gameId: this.currentGame.rowid,
            $time: now
        });
    }

    static onJoin(player: Player) {
        // Don't record bots (Technically there's 100 people who this won't track, but they're all valve employees so I don't care)
        // This does raise the question of what if someone with id 1 joins a game with a bot, will they have the same id?
        if(player.ID3.length <= 2) return;

        if(!this.currentGame) {
            this.pendingPlayers.push(player);
            return;
        }

        if(this.currentGame.players.some(p => p.id === player.ID3)) return;

        this.addPlayer(player);
        this.updateCurrentGame();
    }

    static onGameEnd() {
        if(!this.currentGame || fakeData) return;

        this.updateCurrentGame();
        
        Log.info(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
    }
}