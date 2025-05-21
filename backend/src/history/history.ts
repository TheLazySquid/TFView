import type { Stored, PastGame, PastGameEntry } from "$types/data";
import { HistoryMessages, HistoryRecieves } from "$types/messages";
import { dataPath, fakeData } from "src/consts";
import { fakePastGames } from "src/fakedata/history";
import LogParser from "src/logParser";
import Socket from "src/socket";
import { join } from "node:path";
import { Database } from "bun:sqlite";

export default class History {   
    static currentGame: PastGame | null = null;
    static gamesFile: Bun.BunFile;
    static pastGamesDir: string;
    static db: Database;
    static pageSize = 50;

    static init() {
        Socket.on("history", HistoryRecieves.GetGames, (offset, reply) => {
            reply(this.getGames(offset));
        });

        Socket.on("history", HistoryRecieves.GetGame, (rowid, reply) => {
            reply(this.getGame(rowid));
        });

        if(fakeData) return;

        this.setupDb();
        this.listenToLog();
    }

    static setupDb() {
        this.db = new Database(join(dataPath, "history.sqlite"));

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
    }

    static getGames(offset: number): PastGameEntry[] {
        if(fakeData) return fakePastGames.slice(offset, offset + this.pageSize);

        return this.db.query<PastGameEntry, {}>(`SELECT start, duration, map, rowid FROM games
            ORDER BY start DESC LIMIT ${this.pageSize} OFFSET $offset`)
            .all({ $offset: offset });
    }

    static getGame(id: number) {
        if(fakeData) return fakePastGames.find((g) => g.rowid === id);

        let game = this.db.query<Stored<PastGame>, {}>(`SELECT * FROM games WHERE rowid = $rowid`)
            .get({ $rowid: id });
        return { ...game, players: JSON.parse(game.players) }
    }

    static mapChangeRegex = /(?:\n|^)Team Fortress\r?\nMap: (.+)/g;
    static listenToLog() {
        LogParser.on(this.mapChangeRegex, (data) => {
            this.onGameEnd();

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
            // Don't record bots
            if(player.id.length <= 3) continue;
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
        
        console.log(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
    }
}