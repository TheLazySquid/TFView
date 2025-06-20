import type { StoredPlayer, PastGame, Stored, PlayerEncounter, StoredPastGame, PastGamePlayer, PastPlayer } from "$types/data";
import type { EncounterSearchParams, GameSearchParams, PlayerSearchParams } from "$types/search";
import type { CurrentGame } from "./history";
import { Database } from "bun:sqlite";
import { fakeData, dataPath } from "src/consts";
import { join } from "node:path";
import fs from "fs";
import Log from "src/log";
import { createFakeHistory } from "src/fakedata/history";
import { InfiniteList } from "src/net/infiniteList";
import Server from "src/net/server";
import { Recieves } from "$types/messages";
import type { Player, PlayerSummary } from "$types/lobby";
import { id64ToId3 } from "$shared/steamid";

export default class HistoryDatabase {
    static db: Database;
    static pageSize = 50;
    static pastGames: InfiniteList<PastGame>;
    static pastPlayers: InfiniteList<PastPlayer>;
    static encounters: InfiniteList<PlayerEncounter>;

    static init() {
        this.createDb();

        this.pastGames = new InfiniteList({
            topic: "gamehistory",
            listId: "pastgames",
            getBatch: (offset, params) => this.getGames(offset, params),
            getTotal: (params) => this.countGames(params)
        });

        this.pastPlayers = new InfiniteList({
            topic: "playerhistory",
            listId: "pastplayers",
            getBatch: (offset, params) => this.getPlayers(offset, params),
            getTotal: (params) => this.countPlayers(params)
        });

        this.encounters = new InfiniteList({
            topic: "playerhistory",
            listId: "encounters",
            getBatch: (offset, params) => this.getEncounters(offset, params),
            getTotal: (params) => this.countEncounters(params)
        });

        Server.on(Recieves.GetGame, (rowid, { reply }) => {
            reply(this.getGame(rowid));
        });

        Server.on(Recieves.GetPlayer, (id, { reply }) => {
            reply(this.getPlayerData(id));
        });
    }

    static createDb() {
        let newDb = false;
        const dbPath = join(dataPath, fakeData ? "testhistory.sqlite" : "history.sqlite");
        if(fakeData && !fs.existsSync(dbPath)) newDb = true;

        this.db = new Database(dbPath, { strict: true });

        this.db.run(`CREATE TABLE IF NOT EXISTS main.games (
            map TEXT NOT NULL,
            hostname TEXT,
            ip TEXT,
            start INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            players TEXT NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            demos TEXT
        ); CREATE TABLE IF NOT EXISTS main.encounters (
            playerId TEXT NOT NULL,
            map TEXT NOT NULL,
            name TEXT NOT NULL,
            gameId INTEGER NOT NULL,
            time INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL
        ); CREATE TABLE IF NOT EXISTS main.players (
            id TEXT NOT NULL PRIMARY KEY,
            lastName TEXT NOT NULL,
            lastSeen INTEGER NOT NULL,
            names TEXT NOT NULL,
            avatarHash TEXT,
            createdTimestamp INTEGER,
            tags TEXT,
            nickname TEXT,
            note TEXT
        )`);

        if(newDb) {
            Log.info("Generating fake history data");
            createFakeHistory(this.db);
        }
    }

    static escapeLike(value: string, json = false) {
        // Escape % and _
        value = value.replace(/[\\%_]/g, "\\$&");

        // Sqlite expects quotes to be escaped with another quote
        // And if it's a json string we also want to add in a double backslash beforehand
        if(json) {
            value = value.replaceAll('"', '\\\\""');
        } else {
            value = value.replaceAll('"', '""');
        }

        return value;
    }

    static parseRow<T>(row: Stored<T>, parseKeys: (keyof T)[]): T {
        for(let key of parseKeys) {
            if (typeof row[key] === "string") {
                row[key] = JSON.parse(row[key]);
            }
        }

        return row as T;
    }

    // Queries for past games
    static getGamesQuery(query: string, params: GameSearchParams, offset?: number) {
        let whereClauses: string[] = [];
        if(params.map) whereClauses.push(`map LIKE "%${this.escapeLike(params.map)}%" ESCAPE '\\'`);
        if(params.hostname) whereClauses.push(`hostname LIKE "%${this.escapeLike(params.hostname)}%" ESCAPE '\\'`);
        if(params.after) whereClauses.push("start >= $after");
        if(params.before) whereClauses.push("start <= $before");

        if(whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += ` ORDER BY start DESC LIMIT ${this.pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static getGames(offset: number, params: GameSearchParams) {
        const queryStart = `SELECT start, duration, map, hostname, ip, kills, deaths, rowid FROM games`;
        let query = this.getGamesQuery(queryStart, params, offset);

        return this.db.query<PastGame, {}>(query).all({ ...params, offset });
    }

    static getGame(id: number): StoredPastGame {
        let game = this.db.query<Stored<StoredPastGame>, {}>(`SELECT * FROM games WHERE rowid = rowid`)
            .get({ rowid: id });
        return this.parseRow(game, ["players", "demos"]);
    }

    static countGames(params: GameSearchParams) {
        const queryStart = `SELECT COUNT(1) FROM games`;
        let query = this.getGamesQuery(queryStart, params);

        let result = this.db.query<{ "COUNT(1)": number }, {}>(query).get({ ...params });
        return result["COUNT(1)"];
    }

    // Queries for past players
    static getPlayersQuery(query: string, params: PlayerSearchParams, offset?: number) {
        let whereClauses: string[] = [];
        if(params.after) whereClauses.push("lastSeen >= $after");
        if(params.before) whereClauses.push("lastSeen <= $before");
        
        if(params.name) {
            // Allow searches for id64, id3, or name
            if(params.name.startsWith("[U:1:")) {
                let id3 = params.name.slice(5, -1);
                if(!isNaN(parseInt(id3))) {
                    params.id3 = id3;
                }
            } else if(!isNaN(parseInt(params.name))) {
                params.id64 = id64ToId3(params.name);
                params.id3 = params.name;
            }

            let clause = `(names LIKE "%""${this.escapeLike(params.name, true)}""%" ESCAPE '\\'` +
                ` OR nickname LIKE "%${this.escapeLike(params.name)}%" ESCAPE '\\'`;
            if(params.id3) clause += ` OR id = $id3`;
            else if(params.id64) clause += ` OR id = $id64`;
            clause += ")";

            whereClauses.push(clause);
        }

        if(params.tags) {
            for(let tag of params.tags) {
                whereClauses.push(`tags LIKE "%""${this.escapeLike(tag, true)}""%" ESCAPE '\\'`);
            }
        }

        if(whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += ` ORDER BY lastSeen DESC LIMIT ${this.pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static getPlayers(offset: number, params: PlayerSearchParams): PastPlayer[] {
        const queryStart = `SELECT * FROM players`;
        let query = this.getPlayersQuery(queryStart, params, offset);

        let rows = this.db.query<Stored<StoredPlayer>, {}>(query).all({ ...params, offset });
        return rows.map(row => this.parsePlayerRow(row));
    }

    static parsePlayerRow(row: Stored<StoredPlayer>): PastPlayer {
        let parsed = this.parseRow(row, ["names", "tags"]);

        let tags: Record<string, boolean> = {};
        if(parsed.tags) {
            for(let tag of parsed.tags) tags[tag] = true;
        }

        return { ...parsed, tags };
    }

    static countPlayers(params: PlayerSearchParams) {
        const queryStart = `SELECT COUNT(1) FROM players`;
        let query = this.getPlayersQuery(queryStart, params);

        let result = this.db.query<{ "COUNT(1)": number }, {}>(query).get({ ...params });
        return result["COUNT(1)"];
    }

    // Queries for past encounters
    static getEncountersQuery(query: string, params: EncounterSearchParams, offset?: number) {
        let whereClauses: string[] = [];
        whereClauses.push("playerId = $id");
        if(params.map) whereClauses.push(`map LIKE "%${this.escapeLike(params.map)}%" ESCAPE '\\'`);
        if(params.name) whereClauses.push(`name LIKE "%${this.escapeLike(params.name)}%" ESCAPE '\\'`);
        if(params.after) whereClauses.push("time >= $after");
        if(params.before) whereClauses.push("time <= $before");

        if(whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += ` ORDER BY time DESC LIMIT ${this.pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static countEncounters(params: EncounterSearchParams): number {
        const queryStart = `SELECT COUNT(1) FROM encounters`;
        let query = this.getEncountersQuery(queryStart, params);

        let result = this.db.query<{ "COUNT(1)": number }, {}>(query).get({ ...params });
        return result["COUNT(1)"];
    }

    static getEncounters(offset: number, params: EncounterSearchParams): PlayerEncounter[] {
        const queryStart = `SELECT * FROM encounters`;
        let query = this.getEncountersQuery(queryStart, params, offset);

        return this.db.query<PlayerEncounter, {}>(query).all({ ...params, offset });
    }

    // Saving player data
    static getPlayerData(id: string): PastPlayer {
        let player = this.db.query<Stored<StoredPlayer> | null, {}>(`SELECT * FROM players WHERE id = $id`).get({ id });
        if(!player) return null;
        return this.parsePlayerRow(player);
    }

    static setPlayerUserData(id: string, key: "nickname" | "note", value: string) {
        try {
            this.db.query(`UPDATE players SET ${key} = $value WHERE id = $id`).run({ value, id });
    
            this.pastPlayers.update(id, { [key]: value });
        } catch {
            Log.error(`Tried to set ${key} for player ${id} that doesn't exist`);
        }
    }

    static setPlayerTags(id: string, tags: Record<string, boolean>) {
        try {
            let activeTags = Object.entries(tags).filter(([_, e]) => e).map(([t]) => t);
            this.db.query(`UPDATE players SET tags = $tags WHERE id = $id`)
                .run({ tags: JSON.stringify(activeTags), id });
    
            this.pastPlayers.update(id, { tags });
        } catch {
            Log.error(`Tried to set tags for player ${id} that doesn't exist`);
        }
    }

    static setPlayerSummary(id: string, summary: PlayerSummary) {
        try {
            let avatarHash = summary.avatarHash;
            // We can't see the createdTimestamp of private profiles
            let createdTimestamp = summary.createdTimestamp ?? -1;

            this.db.query(`UPDATE players SET avatarHash = $avatarHash, createdTimestamp = $createdTimestamp WHERE id = $id`)
                .run({ id, avatarHash, createdTimestamp });
        } catch {
            Log.error(`Tried to set user data for player ${id} that doesn't exist`);
        }
    }

    static createCurrentGame(game: CurrentGame) {
        let val = this.db.query(`INSERT INTO games (map, hostname, ip, start, duration, players, kills, deaths)
            VALUES($map, $hostname, $ip, $start, $duration, $players, $kills, $deaths)`).run({
            map: game.map,
            hostname: game.hostname,
            ip: game.ip,
            players: JSON.stringify(game.players),
            start: game.startTime,
            duration: 0, kills: 0, deaths: 0
        });

        this.pastGames.addStart({
            start: game.startTime,
            duration: 0,
            map: game.map,
            hostname: game.hostname,
            ip: game.ip,
            rowid: game.rowid,
            kills: game.kills,
            deaths: game.deaths
        });

        return val.lastInsertRowid as number;
    }

    static updateCurrentGame(game: CurrentGame) {
        this.db.query(`UPDATE games SET duration = $duration, players = $players,
            kills = $kills, deaths = $deaths WHERE rowid = $rowid`).run({
            players: JSON.stringify(game.players),
            duration: Date.now() - game.startTime,
            kills: game.kills,
            deaths: game.deaths,
            rowid: game.rowid
        });
    }

    static updateCurrentHostname(game: CurrentGame) {
        let { hostname, ip, rowid } = game;

        this.db.query(`UPDATE games SET hostname = $hostname, ip = $ip WHERE rowid = $rowid`)
            .run({ hostname, ip, rowid });

        this.pastGames.update(rowid, { hostname, ip });
    }

    static updateCurrentDemos(game: CurrentGame) {
        this.db.query(`UPDATE games SET demos = $demos WHERE rowid = $rowid`).run({
            demos: JSON.stringify(game.demos),
            rowid: game.rowid
        });
    }

    static recordPlayerEncounter(player: Player, game: CurrentGame) {
        const now = Date.now();

        let val = this.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
            VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).run({
            playerId: player.ID3,
            map: game.map,
            name: player.name,
            gameId: game.rowid,
            time: now,
            kills: player.kills,
            deaths: player.deaths
        });

        // Add the new name if it doesn't already exist
        let names: string[] = [player.name];
        
        let playerData = this.getPlayerData(player.ID3);
        if(playerData && !playerData.names.includes(player.name)) {
            playerData.names.push(player.name);
        }

        const update = { id: player.ID3, lastSeen: now, lastName: player.name, names: JSON.stringify(names) };

        if(playerData) {
            this.db.query(`UPDATE players SET lastSeen = $lastSeen, lastName = $lastName, names = $names WHERE id = $id`)
                .run(update);

            this.pastPlayers.update(player.ID3, { lastSeen: now, lastName: player.name });
        } else {
            this.db.query(`INSERT INTO players (id, lastSeen, lastName, names) VALUES($id, $lastSeen, $lastName, $names)`)
                .run(update);

            this.pastPlayers.addStart({ id: player.ID3, lastSeen: now, lastName: player.name, names: [player.name], tags: {} });
        }

        return val.lastInsertRowid as number;
    }

    static updatePlayerEncounter(rowid: number, info: PastGamePlayer) {
        try {
            this.db.query(`UPDATE encounters SET kills = $kills, deaths = $deaths WHERE rowid = $rowid`)
                .run({ kills: info.kills, deaths: info.deaths, rowid });
        } catch {
            console.trace("Somehow kills managed to be null despite the fact that that's completely impossible", info);
        }
    }
}