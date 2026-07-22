import Settings from "$src/settings/settings";
import HistoryDatabase from "$src/history/database";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import type { Stored, StoredPlayer, ParsedDemo } from "$types/data";
import { getCurrentUserId } from "$src/util";
import { MultiBar, Presets } from "cli-progress";
import { Database } from "bun:sqlite";
import { dataPath } from "$src/consts";

interface PastGamePlayer {
    id: string;
    name: string;
    time: number;
    kills: number;
    deaths: number;
}

await Settings.init();
HistoryDatabase.createDb();

const steamId = await getCurrentUserId();
const demosPath = join(Settings.get("tfPath"), "demos");
const demos = readdirSync(demosPath).filter(file => file.endsWith(".dem"));

const referenceDb = new Database(join(dataPath, "oldHistoryReference.sqlite"), { strict: true });

// Check if there's already saved progress
const progressFile = Bun.file("scripts/demoParseProgress.json");
let parsed = 0;
if(await progressFile.exists()) {
    parsed = (await progressFile.json()).filesParsed;
}

const multi = new MultiBar({
    format: "{bar} | {filename} | {value}/{total}"
}, Presets.shades_grey);
const bar = multi.create(demos.length, parsed, { filename: demos[parsed] });

while(parsed < demos.length) {
    const filename = demos[parsed];
    if(!filename) break;

    bar.update(parsed, { filename });
    recordDemo(filename);

    parsed++;
    await progressFile.write(JSON.stringify({ filesParsed: parsed }));
}

multi.stop();

function recordDemo(name: string) {
    const parts = name.replace(".dem", "").replace("_", "-").split("-");
    if(parts.length !== 6) return;

    const [year, month, day, hour, minute, second] = parts.map(part => parseInt(part, 10));
    if(!year || !month || !day || !hour || !minute || !second) return;

    const date = new Date(year, month - 1, day, hour, minute, second);

    // Assumes you have https://codeberg.org/demostf/parser installed
    const command = `parse_demo "${join(demosPath, name)}"`;
    
    try {
        const output: ParsedDemo = JSON.parse(execSync(command).toString());
    
        const players: Record<number, PastGamePlayer> = {};
        const seenIds = new Set<string>();
        let playerId = 0;
        let playerKills = 0;
        let playerDeaths = 0;

        for(const player of Object.values(output.users)) {
            const id3 = player.steamId.slice(5, -1); // Remove [U:1: and ]
            if(seenIds.has(id3)) continue;
            seenIds.add(id3);

            if(id3 === steamId) playerId = player.userId;

            // Ignore bots
            if(id3.length <= 2) continue;

            players[player.userId] = {
                id: id3,
                name: player.name,
                time: date.getTime(),
                kills: 0,
                deaths: 0
            }
        }

        // Get the playerid from our name in the header otherwise
        if(!playerId) {
            for(const player of Object.values(output.users)) {
                if(player.name === output.header.nick) {
                    playerId = player.userId;
                    break;
                }
            }
        }

        if(!playerId) return;
        delete players[playerId];

        for(const kill of output.deaths) {
            const killer = players[kill.killer];
            if(killer) killer.kills++;

            const victim = players[kill.victim];
            if(victim) victim.deaths++;
           
            if(kill.killer === playerId) playerKills++;
            if(kill.victim === playerId) playerDeaths++;
        }
    
        // Record games
        const gameResult = HistoryDatabase.db.query(`INSERT INTO games (map, ip, start, duration, players, kills, deaths, demos)
            VALUES($map, $ip, $start, $duration, $players, $kills, $deaths, $demos)`).run({
            map: output.header.map,
            ip: output.header.server,
            start: date.getTime(),
            duration: output.header.duration * 1000,
            kills: playerKills,
            deaths: playerDeaths,
            demos: JSON.stringify([name])
        });

        const rowid = gameResult.lastInsertRowid;

        for(const player of Object.values(players)) {
            // Record encounters
            HistoryDatabase.db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
                VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).run({
                playerId: player.id,
                map: output.header.map,
                name: player.name,
                gameId: rowid,
                time: player.time,
                kills: player.kills,
                deaths: player.deaths
            });
        
            // Record players
            const data = HistoryDatabase.getPlayerData(player.id);
            if(data) {
                if(player.time > data.lastSeen) {
                    data.lastName = player.name;
                    data.lastSeen = player.time;
                }

                data.encounters++;

                if(!data.names.includes(player.name)) {
                    data.names.push(player.name);
                }

                HistoryDatabase.db.query(`UPDATE players SET lastName = $lastName, lastSeen = $lastSeen, encounters = $encounters, names = $names
                    WHERE id = $id`).run({
                    id: player.id,
                    lastName: data.lastName,
                    lastSeen: data.lastSeen,
                    encounters: data.encounters,
                    names: JSON.stringify(data.names)
                });
            } else {
                // Try to get avatarHash/createdTimestamp from the reference database
                const referenceData = referenceDb.query<Stored<StoredPlayer>, {}>(`SELECT * FROM players WHERE id = $id`)
                    .get({ id: player.id });

                HistoryDatabase.db.query(`INSERT INTO players (id, lastName, lastSeen, names, encounters, avatarHash, createdTimestamp)
                    VALUES($id, $lastName, $lastSeen, $names, $encounters, $avatarHash, $createdTimestamp)`).run({
                    id: player.id,
                    lastName: player.name,
                    lastSeen: player.time,
                    names: JSON.stringify([player.name]),
                    encounters: 1,
                    avatarHash: referenceData?.avatarHash ?? null,
                    createdTimestamp: referenceData?.createdTimestamp ?? null
                });
            }
        }
    } catch {
        multi.log(`Failed to parse demo: ${name}`);
    }
}