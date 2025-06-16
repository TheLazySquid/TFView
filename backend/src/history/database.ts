import { Database } from "bun:sqlite";
import { fakeData, dataPath } from "src/consts";
import { join } from "node:path";
import fs from "fs";
import Log from "src/log";
import { createFakeHistory } from "src/fakedata/history";

export function createDatabase() {
let newDb = false;
    const dbPath = join(dataPath, fakeData ? "testhistory.sqlite" : "history.sqlite");
    if(fakeData && !fs.existsSync(dbPath)) newDb = true;

    const db = new Database(dbPath);

    db.run(`CREATE TABLE IF NOT EXISTS main.games (
        map TEXT NOT NULL,
        hostname TEXT,
        ip TEXT,
        start INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        players TEXT NOT NULL,
        kills INTEGER NOT NULL,
        deaths INTEGER NOT NULL
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
        avatarHash TEXT,
        tags TEXT,
        nickname TEXT,
        note TEXT
    )`);

    if(newDb) {
        Log.info("Generating fake history data");
        createFakeHistory(db);
    }

    return db;
}