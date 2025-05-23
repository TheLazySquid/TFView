import type { Stored, PastGame, PastGameEntry, PlayerEncounter } from "$types/data";
import { HistoryMessages, Recieves } from "$types/messages";
import { dataPath, fakeData } from "src/consts";
import LogParser from "src/logParser";
import Socket from "src/socket";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import fs from "fs";
import { createFakeHistory } from "src/fakedata/history";
import EventEmitter from "node:events";

export default class History {   
    static currentGame: PastGame | null = null;
    static gamesFile: Bun.BunFile;
    static pastGamesDir: string;
    static db: Database;
    static pageSize = 50;
    static events = new EventEmitter();

    static init() {
        Socket.on(Recieves.GetGames, (offset, reply) => {
            reply(this.getGames(offset));
        });

        Socket.on(Recieves.GetGame, (rowid, reply) => {
            reply(this.getGame(rowid));
        });

        Socket.on(Recieves.GetEncounters, ({ id, offset }, reply) => {
            reply(this.getEncounters(id, offset));
        })
        
        this.setupDb();

        if(fakeData) return;
        this.listenToLog();
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
    static listenToLog() {
        LogParser.on(this.mapChangeRegex, (data) => {
            this.onGameEnd();

            this.events.emit("startGame");
            this.currentGame = {
                map: data[1],
                start: Date.now(),
                duration: 0,
                players: []
            }

            console.log("Game started:", this.currentGame.map);
        });
    }

    static onGameEnd() {
        if(!this.currentGame || fakeData) return;
        this.currentGame.duration = Date.now() - this.currentGame.start;

        // save the current game
        let val = this.db.query(`INSERT INTO games (map, start, duration, players)
            VALUES($map, $start, $duration, $players)`).run({
            $map: this.currentGame.map,
            $players: JSON.stringify(this.currentGame.players),
            $start: this.currentGame.start,
            $duration: this.currentGame.duration
        });
        let rowid = val.lastInsertRowid as number;

        // There's probably some way to make this into one query
        const addPlayer = this.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time)
            VALUES($playerId, $map, $name, $gameId, $time)`);
        for(let player of this.currentGame.players) {
            // Don't record bots (Technically there's 100 people who this won't track, but they're all valve employees so I don't care)
            // This does raise the question of what if someone with id 1 joins a game with a bot, will they have the same id?
            if(player.id.length <= 2) continue;
            addPlayer.run({
                $playerId: player.id,
                $map: this.currentGame.map,
                $name: player.name,
                $gameId: rowid,
                $time: player.time
            });
        }

        const entry = { ...this.currentGame, rowid: rowid, players: undefined };
        Socket.send("history", HistoryMessages.GameAdded, entry);
        
        console.trace(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
    }
}