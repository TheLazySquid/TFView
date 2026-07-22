import type { StoredPlayer, PastGame, Stored, PlayerEncounter, StoredPastGame, PastPlayer } from "$types/data";
import type { EncounterSearchParams, GameSearchParams, PlayerSearchParams } from "$types/search";
import type { CurrentGame } from "./history";
import { Database } from "bun:sqlite";
import { flags, dataPath, pageSize } from "$src/consts";
import { join } from "node:path";
import Log from "$src/log";
import { createFakeHistory } from "$src/fakedata/history";
import { InfiniteList } from "$src/net/infiniteList";
import Server from "$src/net/server";
import { Message, Recieves } from "$types/messages";
import type { Player, PlayerSummary } from "$types/lobby";
import { id64ToId3 } from "$shared/steamid";
import SteamApi from "$src/net/steamApi";
import Close from "$src/close";
import { steamProfilesUrl, steamVanityUrl } from "$shared/consts";
import { isStringNumber } from "$shared/util";
import Mutes from "$src/game/mutes";

interface CountResult {
    "COUNT(1)": number;
}

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
            const data = this.getPlayerData(id);
            reply(data);
        });

        Close.on("close", () => this.db.close());
    }

    static version = 3;
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
            note TEXT,
            sourceBanned INTEGER
        )`);

        const dbVersion = this.db.prepare<{ "user_version": number }, []>(`PRAGMA main.user_version;`)
            .get()?.user_version;

        if(dbVersion) {
            // Add the players.avatars and encounters.avatarHash columns if they don't exist
            if(!newDb && dbVersion < 1) {
                Log.info("Migrating history database to version 1");
                this.db.run(`ALTER TABLE players ADD COLUMN avatars TEXT NOT NULL DEFAULT '[]';`);
                this.db.run(`ALTER TABLE encounters ADD COLUMN avatarHash TEXT;`);
            }
    
            // Remove the games.players column
            if(!newDb && dbVersion < 2) {
                Log.info("Migrating history database to version 2");
                this.db.run(`ALTER TABLE games DROP COLUMN players`);
            }
    
            // Add the sourceBanned column to players
            if(!newDb && dbVersion < 3) {
                Log.info("Migrating history database to version 3");
                this.db.run(`ALTER TABLE players ADD COLUMN sourceBanned INTEGER;`);
            }
        }

        this.db.prepare(`PRAGMA main.user_version = ${this.version};`).run();

        if(newDb && flags.fakeData) {
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

    static parseRow<T>(row: Stored<T>, objects: (keyof T)[], booleans: (keyof T)[] = []): T {
        const parsed = row as T;

        for(const key of objects) {
            if (typeof row[key] === "string") {
                parsed[key] = JSON.parse(row[key]);
            }
        }

        for(const key of booleans) {
            parsed[key] = Boolean(row[key]) as any;
        }

        return parsed;
    }

    // Queries for past games
    static getGamesQuery(query: string, params: GameSearchParams, offset?: number) {
        const whereClauses: string[] = [];
        if(params.map) whereClauses.push(`map LIKE "%${this.escapeLike(params.map)}%" ESCAPE '\\'`);
        if(params.hostname) whereClauses.push(`hostname LIKE "%${this.escapeLike(params.hostname)}%" ESCAPE '\\'`);
        if(params.after) whereClauses.push("start >= $after");
        if(params.before) whereClauses.push("start <= $before");

        if(whereClauses.length > 0) query += ` WHERE ${whereClauses.join(" AND ")}`;
        query += ` ORDER BY start DESC LIMIT ${pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static getGames(offset: number, params: GameSearchParams) {
        const queryStart = `SELECT start, duration, map, hostname, ip, kills, deaths, rowid FROM games`;
        const query = this.getGamesQuery(queryStart, params, offset);

        return this.db.query<PastGame, {}>(query).all({ ...params, offset });
    }

    static getGame(id: number): StoredPastGame | null {
        const game = this.db.query<Stored<StoredPastGame>, {}>(`SELECT *, rowid FROM games WHERE rowid = $rowid`)
            .get({ rowid: id });
        if(!game) return null;

        return this.parseRow(game, ["demos"]);
    }

    static countGames(params: GameSearchParams) {
        const queryStart = `SELECT COUNT(1) FROM games`;
        const query = this.getGamesQuery(queryStart, params);

        const result = this.db.query<CountResult, {}>(query).get({ ...params })!;
        return result["COUNT(1)"];
    }

    // Queries for past players
    static async getPlayersQuery(query: string, params: PlayerSearchParams, offset?: number) {
        const whereClauses: string[] = [];
        if(params.after) whereClauses.push("lastSeen >= $after");
        if(params.before) whereClauses.push("lastSeen <= $before");
        
        if(params.name) {
            // Allow searches for id64, id3, name, or profile url
            if(params.name.startsWith("[U:1:")) {
                const id3 = params.name.slice(5, -1);
                if(isStringNumber(id3)) params.id3 = id3;
            } else if(isStringNumber(params.name)) {
                params.id64 = id64ToId3(params.name);
                params.id3 = params.name;
            } else if(params.name.startsWith(steamProfilesUrl)) {
                const id64 = params.name.slice(steamProfilesUrl.length).split("/", 1)[0]!;
                if(isStringNumber(id64)) params.id64 = id64ToId3(id64);
            } else if(params.name.startsWith(steamVanityUrl)) {
                const vanity = params.name.slice(steamVanityUrl.length).split("/", 1)[0]!;
                const resolved = await SteamApi.resolveVanityUrl(vanity);
                if(resolved) params.id64 = resolved;
            }

            let clause = `(names LIKE "%${this.escapeLike(params.name, true)}%" ESCAPE '\\'` +
                ` OR nickname LIKE "%${this.escapeLike(params.name)}%" ESCAPE '\\'`;
            if(params.id3) clause += ` OR id = $id3`;
            if(params.id64) clause += ` OR id = $id64`;
            clause += ")";

            whereClauses.push(clause);
        }

        if(params.tags) {
            for(const tag in params.tags) {
                if(!params.tags[tag]) continue;
                whereClauses.push(`tags LIKE "%""${this.escapeLike(tag, true)}""%" ESCAPE '\\'`);
            }
        }

        if(whereClauses.length > 0) query += ` WHERE ${whereClauses.join(" AND ")}`;
        if(params.sortBy === "encounters") query += ` ORDER BY encounters DESC `;
        else query += ` ORDER BY lastSeen DESC `;
        query += ` LIMIT ${pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static async getPlayers(offset: number, params: PlayerSearchParams): Promise<PastPlayer[]> {
        const queryStart = `SELECT * FROM players`;
        const query = await this.getPlayersQuery(queryStart, params, offset);

        const rows = this.db.query<Stored<StoredPlayer>, {}>(query).all({ ...params, offset });
        const parsed = rows.map(row => this.parsePlayerRow(row));
        
        // Fetch any missing avatarHashes, with low priority
        for(const data of parsed) {
            if(data.avatarHash) continue;
            
            const id = data.id;
            SteamApi.getSummary(id, (summary) => {
                this.pastPlayers.update(id, summary);
                Server.send("pastplayer", Message.PastPlayerUpdate, {
                    id, ...summary
                });
            }, true);
        }

        return parsed;
    }

    static parsePlayerRow(row: Stored<StoredPlayer>): PastPlayer {
        const parsed = this.parseRow(row, ["names", "avatars", "tags"], ["sourceBanned"]);

        // Make the tags a record instead of an array
        const tags: Record<string, boolean> = {};
        if(parsed.tags) {
            for(const tag of parsed.tags) tags[tag] = true;
        }

        // Check if the player is currently muted
        const muted = Mutes.isMuted(parsed.id);

        return { ...parsed, tags, muted };
    }

    static async countPlayers(params: PlayerSearchParams) {
        const queryStart = `SELECT COUNT(1) FROM players`;
        const query = await this.getPlayersQuery(queryStart, params);

        const result = this.db.query<CountResult, {}>(query).get({ ...params })!;
        return result["COUNT(1)"];
    }

    // Queries for past encounters
    static getEncountersQuery(query: string, params: EncounterSearchParams, offset?: number) {
        const whereClauses: string[] = [];
        if(params.id) whereClauses.push("playerId = $id");
        if(params.gameId) whereClauses.push("gameId = $gameId");
        if(params.map) whereClauses.push(`map LIKE "%${this.escapeLike(params.map)}%" ESCAPE '\\'`);
        if(params.name) whereClauses.push(`name LIKE "%${this.escapeLike(params.name)}%" ESCAPE '\\'`);
        if(params.after) whereClauses.push("time >= $after");
        if(params.before) whereClauses.push("time <= $before");

        if(whereClauses.length > 0) query += ` WHERE ${whereClauses.join(" AND ")}`;
        query += ` ORDER BY time DESC LIMIT ${pageSize}`;
        if(offset !== undefined) query += ` OFFSET $offset`;

        return query;
    }

    static countEncounters(params: EncounterSearchParams): number {
        const queryStart = `SELECT COUNT(1) FROM encounters`;
        const query = this.getEncountersQuery(queryStart, params);

        const result = this.db.query<CountResult, {}>(query).get({ ...params })!;
        return result["COUNT(1)"];
    }

    static getEncounters(offset: number, params: EncounterSearchParams): PlayerEncounter[] {
        const queryStart = `SELECT * FROM encounters`;
        const query = this.getEncountersQuery(queryStart, params, offset);

        return this.db.query<PlayerEncounter, {}>(query).all({ ...params, offset });
    }

    // Saving player data
    static getPlayerData(id: string): PastPlayer | null {
        const player = this.db.query<Stored<StoredPlayer> | null, {}>(`SELECT * FROM players WHERE id = $id`).get({ id });
        if(!player) return null;

        return this.parsePlayerRow(player);
    }

    static setPlayerUserData(id: string, key: "nickname" | "note", value: string | null) {
        try {
            this.db.query(`UPDATE players SET ${key} = $value WHERE id = $id`).run({ value, id });
    
            this.pastPlayers.update(id, { [key]: value });
        } catch(e) {
            Log.error(`Failed to set ${key} for player ${id}`, e);
        }
    }

    static setPlayerTags(id: string, tags: Record<string, boolean>) {
        try {
            const activeTags = Object.entries(tags).filter(([_, e]) => e).map(([t]) => t);
            this.db.query(`UPDATE players SET tags = $tags WHERE id = $id`)
                .run({ tags: JSON.stringify(activeTags), id });
    
            this.pastPlayers.update(id, { tags });
        } catch(e) {
            Log.error(`Failed to set user data for player ${id}`, e);
        }
    }

    static setPlayerSummary(id: string, summary: PlayerSummary) {
        try {
            const avatarHash = summary.avatarHash;
            // We can't see the createdTimestamp of private profiles
            const createdTimestamp = summary.createdTimestamp ?? -1;

            this.db.query(`UPDATE players SET avatarHash = $avatarHash, createdTimestamp = $createdTimestamp, 
                avatars = $avatars WHERE id = $id`)
                .run({ id, avatarHash, createdTimestamp, avatars: JSON.stringify(summary.avatars) });

            this.pastPlayers.update(id, { avatarHash, createdTimestamp });
        } catch(e) {
            Log.error(`Failed to set user data for player ${id}`, e);
        }
    }

    static updatePlayerName(id: string, encounterRowid: number, name: string, names: string[]) {
        this.db.query(`UPDATE players SET lastName = $lastName, names = $names WHERE id = $id`)
            .run({ id, lastName: name, names: JSON.stringify(names) });

        this.db.query(`UPDATE encounters SET name = $name WHERE rowid = $rowid`)
            .run({ name, rowid: encounterRowid });
    }

    static markPlayerSourceBanned(id: string) {
        // Bans are never removed
        this.db.query(`UPDATE players SET sourceBanned = 1 WHERE id = $id`).run({ id });
        this.pastPlayers.update(id, { sourceBanned: true });
    }

    static createCurrentGame(game: CurrentGame) {
        const val = this.db.query(`INSERT INTO games (map, hostname, ip, start, duration, kills, deaths)
            VALUES($map, $hostname, $ip, $start, $duration, $kills, $deaths)`).run({
            map: game.map,
            hostname: game.hostname ?? null,
            ip: game.ip ?? null,
            start: game.startTime,
            duration: 0, kills: 0, deaths: 0
        });

        const rowid = val.lastInsertRowid as number;

        this.pastGames.addStart({
            start: game.startTime,
            duration: 0,
            map: game.map,
            hostname: game.hostname,
            ip: game.ip,
            rowid: rowid,
            kills: game.kills,
            deaths: game.deaths
        });

        return rowid;
    }

    static updateCurrentGame(game: CurrentGame) {
        const update = {
            duration: Date.now() - game.startTime,
            kills: game.kills,
            deaths: game.deaths
        }

        this.db.query(`UPDATE games SET duration = $duration, kills = $kills,
            deaths = $deaths WHERE rowid = $rowid`).run({
            ...update,
            rowid: game.rowid
        });

        this.pastGames.update(game.rowid, update);
    }

    static updateCurrentHostname(game: CurrentGame) {
        const { rowid, hostname, ip } = game;

        this.db.query(`UPDATE games SET hostname = $hostname, ip = $ip WHERE rowid = $rowid`).run({
            hostname: hostname ?? null,
            ip: ip ?? null,
            rowid
        });

        console.log("Updating:", rowid, hostname, ip);
        this.pastGames.update(rowid, { hostname, ip });
    }

    static updateCurrentDemos(game: CurrentGame) {
        this.db.query(`UPDATE games SET demos = $demos WHERE rowid = $rowid`).run({
            demos: JSON.stringify(game.demos),
            rowid: game.rowid
        });
    }

    static recordPlayerEncounter(player: Player, game: CurrentGame) {
        // Ignore unconnected/bots
        if(player.isBot) return;
        
        const now = Date.now();

        const val = this.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths, avatarHash)
            VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths, $avatarHash)`).run({
            playerId: player.ID3,
            map: game.map,
            name: player.name,
            gameId: game.rowid,
            time: now,
            kills: player.kills,
            deaths: player.deaths,
            avatarHash: player.avatarHash ?? null
        });

        // Add the new name if it doesn't already exist
        let names: string[] = [];
        const playerData = this.getPlayerData(player.ID3);
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

    static updateEncounter(rowid: number, info: Partial<PlayerEncounter>) {
        const fields = [];
        for(const key in info) {
            fields.push(`${key} = $${key}`);
        }

        this.db.query(`UPDATE encounters SET ${fields.join(", ")} WHERE rowid = $rowid`)
            .run({ rowid, ...info });
    }

    // Deleting games
    static deleteGame(rowid: number) {
        const run = this.db.transaction(() => {
            this.db.query(`DELETE FROM games WHERE rowid = $rowid`).run({ rowid });

            // Remove 1 from the encounters of each player in the game
            const players = this.db.query<{ playerId: string }, {}>(`SELECT playerId FROM encounters WHERE gameId = $rowid`).all({ rowid });

            const encounters: (number | null)[] = [];
            for(const player of players) {
                // Get the number of encounters for each player, then decrease by 1
                const val = this.db.query<{ encounters: number }, {}>(`SELECT encounters FROM players WHERE id = $id`).get({ id: player.playerId });
                if(val) {
                    encounters.push(val.encounters - 1);
                    this.db.query(`UPDATE players SET encounters = $encounters WHERE id = $id`).run({ encounters: val.encounters - 1, id: player.playerId });
                } else {
                    encounters.push(null);
                }
            }

            // Delete the encounters for the game
            this.db.query(`DELETE FROM encounters WHERE gameId = $rowid`).run({ rowid });
            
            // Update infinite lists
            this.pastGames.delete(rowid);
            for(let i = 0; i < players.length; i++) {
                const player = players[i];
                const playerEncounters = encounters[i];
                if(!player || !playerEncounters) continue;

                this.pastPlayers.update(player.playerId, { encounters: playerEncounters });
            }
        });

        run.immediate();
    }
}