import type { StoredPlayer, PastGame, Stored, PlayerEncounter, StoredPastGame, PastGamePlayer, PastPlayer } from "$types/data";
import type { EncounterSearchParams, GameSearchParams, PlayerSearchParams } from "$types/search";
import type { CurrentGame } from "./history";
import { Database } from "bun:sqlite";
import { flags, dataPath, pageSize } from "src/consts";
import { join } from "node:path";
import Log from "src/log";
import { createFakeHistory } from "src/fakedata/history";
import { InfiniteList } from "src/net/infiniteList";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";
import type { Player, PlayerSummary } from "$types/lobby";
import { id64ToId3 } from "$shared/steamid";
import SteamApi from "src/net/steamApi";

export default class HistoryDatabase {
    static db: Database;
    static pastGames: InfiniteList<PastGame, GameSearchParams>;
    static pastPlayers: InfiniteList<PastPlayer, PlayerSearchParams>;
    static encounters: InfiniteList<PlayerEncounter, EncounterSearchParams>;

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
            let data = this.getPlayerData(id);
            reply(data);

            // Try to update their avatarHash
            if(data?.avatarHash) return;

            SteamApi.getSummary(id, (summary) => {
                this.pastPlayers.update(id, summary);
                Server.send("pastplayer", Message.PastPlayerUpdate, {
                    id, ...summary
                });
            });
        });
    }

    static close() {
        this.db.close();
    }

    static version = 1;
    static createDb() {
        const dbPath = join(dataPath, flags.fakeData ? "testhistory.sqlite" : "history.sqlite");
        
        this.db = new Database(dbPath, { strict: true });
        const newDb = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='games';`).get() === null;

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
            avatarHash TEXT,
            gameId INTEGER NOT NULL,
            time INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL
        ); CREATE TABLE IF NOT EXISTS main.players (
            id TEXT NOT NULL PRIMARY KEY,
            lastName TEXT NOT NULL,
            lastSeen INTEGER NOT NULL,
            names TEXT NOT NULL,
            encounters INTEGER NOT NULL,
            avatarHash TEXT,
            avatars TEXT,
            createdTimestamp INTEGER,
            tags TEXT,
            nickname TEXT,
            note TEXT
        )`);

        const dbVersion = this.db.prepare<{ "user_version": number }, []>(`PRAGMA main.user_version;`)
            .get().user_version;

        // Add the players.avatars and encounters.avatarHash columns if they don't exist
        if(!newDb && dbVersion < 1) {
            Log.info("Migrating history database to version 1");
            this.db.run(`ALTER TABLE players ADD COLUMN avatars TEXT NOT NULL DEFAULT '[]';`);
            this.db.run(`ALTER TABLE encounters ADD COLUMN avatarHash TEXT;`);
        }

        this.db.prepare(`PRAGMA main.user_version = ${this.version};`).run();

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
        query += ` ORDER BY start DESC LIMIT ${pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static getGames(offset: number, params: GameSearchParams) {
        const queryStart = `SELECT start, duration, map, hostname, ip, kills, deaths, rowid FROM games`;
        let query = this.getGamesQuery(queryStart, params, offset);

        return this.db.query<PastGame, {}>(query).all({ ...params, offset });
    }

    static getGame(id: number): StoredPastGame {
        let game = this.db.query<Stored<StoredPastGame>, {}>(`SELECT *, rowid FROM games WHERE rowid = $rowid`)
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
                if(!isNaN(Number(id3))) {
                    params.id3 = id3;
                }
            } else if(!isNaN(Number(params.name))) {
                params.id64 = id64ToId3(params.name);
                params.id3 = params.name;
            }

            let clause = `(names LIKE "%${this.escapeLike(params.name, true)}%" ESCAPE '\\'` +
                ` OR nickname LIKE "%${this.escapeLike(params.name)}%" ESCAPE '\\'`;
            if(params.id3) clause += ` OR id = $id3`;
            if(params.id64) clause += ` OR id = $id64`;
            clause += ")";

            whereClauses.push(clause);
        }

        if(params.tags) {
            for(let tag of params.tags) {
                whereClauses.push(`tags LIKE "%""${this.escapeLike(tag, true)}""%" ESCAPE '\\'`);
            }
        }

        if(whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        if(params.sortBy === "encounters") query += ` ORDER BY encounters DESC `;
        else query += ` ORDER BY lastSeen DESC `;
        query += ` LIMIT ${pageSize}`;
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
        let parsed = this.parseRow(row, ["names", "avatars", "tags"]);

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
        query += ` ORDER BY time DESC LIMIT ${pageSize}`;
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

            this.db.query(`UPDATE players SET avatarHash = $avatarHash, createdTimestamp = $createdTimestamp, 
                avatars = $avatars WHERE id = $id`)
                .run({ id, avatarHash, createdTimestamp, avatars: JSON.stringify(summary.avatars) });

            this.pastPlayers.update(id, { avatarHash, createdTimestamp });
        } catch {
            Log.error(`Tried to set user data for player ${id} that doesn't exist`);
        }
    }

    static updatePlayerName(id: string, encounterRowid: number, name: string, names: string[]) {
        this.db.query(`UPDATE players SET lastName = $lastName, names = $names WHERE id = $id`)
            .run({ id, lastName: name, names: JSON.stringify(names) });

        this.db.query(`UPDATE encounters SET name = $name WHERE rowid = $rowid`)
            .run({ name, rowid: encounterRowid });
    }

    static updatePlayerAvatar(encounterRowid: number, avatarHash: string) {
        this.db.query(`UPDATE encounters SET avatarHash = $avatarHash WHERE rowid = $rowid`)
            .run({ avatarHash, rowid: encounterRowid });
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
        let names: string[] = [];
        let playerData = this.getPlayerData(player.ID3);
        if(playerData) names = playerData.names;

        if(!names.includes(player.name)) names.push(player.name);

        const update = { id: player.ID3, lastSeen: now, lastName: player.name, names: JSON.stringify(names), encounters: 1 };
        if(playerData) update.encounters = playerData.encounters + 1;

        if(playerData) {
            this.db.query(`UPDATE players SET lastSeen = $lastSeen, lastName = $lastName, names = $names, encounters = $encounters WHERE id = $id`)
                .run(update);

            this.pastPlayers.update(player.ID3, {
                lastSeen: now,
                lastName: player.name,
                encounters: update.encounters,
                names
            });
        } else {
            this.db.query(`INSERT INTO players (id, lastSeen, lastName, names, encounters) VALUES($id, $lastSeen, $lastName, $names, $encounters)`)
                .run(update);

            this.pastPlayers.addStart({
                id: player.ID3,
                lastSeen: now,
                lastName: player.name,
                names,
                avatars: player.avatars,
                tags: {},
                encounters: update.encounters
            });
        }

        return val.lastInsertRowid as number;
    }

    static updatePlayerEncounter(rowid: number, info: PastGamePlayer) {
        this.db.query(`UPDATE encounters SET kills = $kills, deaths = $deaths WHERE rowid = $rowid`)
            .run({ kills: info.kills, deaths: info.deaths, rowid });
    }

    // Deleting games
    static deleteGame(rowid: number) {
        const run = this.db.transaction(() => {
            this.db.query(`DELETE FROM games WHERE rowid = $rowid`).run({ rowid });

            // Remove 1 from the encounters of each player in the game
            let players = this.db.query<{ playerId: string }, {}>(`SELECT playerId FROM encounters WHERE gameId = $rowid`).all({ rowid });

            let encounters: (number | null)[] = [];
            for(let player of players) {
                // Get the number of encounters for each player, then decrease by 1
                let val = this.db.query<{ encounters: number }, {}>(`SELECT encounters FROM players WHERE id = $id`).get({ id: player.playerId });
                if(!val) encounters.push(null);

                encounters.push(val.encounters - 1);
                this.db.query(`UPDATE players SET encounters = $encounters WHERE id = $id`).run({ encounters: val.encounters - 1, id: player.playerId });
            }

            // Delete the encounters for the game
            this.db.query(`DELETE FROM encounters WHERE gameId = $rowid`).run({ rowid });
            
            // Update infinite lists
            this.pastGames.delete(rowid);
            for(let i = 0; i < players.length; i++) {
                if(encounters[i] === null) continue;
                let playerId = players[i].playerId;
                this.pastPlayers.update(playerId, { encounters: encounters[i] });
            }
        });

        run.immediate();
    }
}