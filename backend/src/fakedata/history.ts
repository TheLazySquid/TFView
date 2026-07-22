import type { Database } from "bun:sqlite";
import { mapNames, playerIds, playerNames, random } from "./util";

export function createFakeHistory(db: Database) {
    let start = Date.now() - 1e6;
    const recorded: boolean[] = [];

    for(let i = 0; i < 60; i++) {
        start -= random(1e6, 1e7);

        const map = mapNames[random(0, mapNames.length - 1)];
        if(!map) continue;

        const numPlayers = random(5, 24);
        const available = [];
        for(let i = 0; i < playerNames.length; i++) available.push(i);

        for(let j = 0; j < numPlayers; j++) {
            const availableIndex = random(0, available.length - 1);
            const index = available[availableIndex];
            if(!index) continue;

            available.splice(availableIndex, 1);
            const time = start + random(0, 1e5);

            const id = playerIds[index];
            const name = playerNames[index];
            if(!id || !name) continue;

            if(!recorded[index]) {
                recorded[index] = true;
                db.query(`INSERT INTO players (id, lastName, lastSeen, names, encounters)
                    VALUES($id, $lastName, $lastSeen, $names, $encounters)`).run({
                    id,
                    lastName: name,
                    lastSeen: time,
                    names: JSON.stringify([name]),
                    // This isn't accurate, but we don't care for fake data
                    encounters: random(1, 15)
                });
            }

            const player = {
                id,
                name,
                time,
                deaths: random(0, 10),
                kills: random(0, 10)
            }

            db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
                VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).all({
                playerId: id,
                name,
                map,
                gameId: i + 1,
                time: time,
                kills: player.kills,
                deaths: player.deaths
            });
        }

        const date = new Date(start);
        const demo = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.dem`;
        const demos = JSON.stringify([demo]);

        db.query(`INSERT INTO games (map, hostname, ip, start, duration, kills, deaths, demos)
            VALUES($map, $hostname, $ip, $start, $duration, $kills, $deaths, $demos)`).run({
            map: map,
            start: start,
            duration: random(5e5, 5e6),
            hostname: `Some server ${Math.random().toString(36).slice(2)}`,
            ip: `${random(1, 255)}.${random(1, 255)}.${random(1, 255)}.${random(1, 255)}:${random(1000, 65535)}`,
            kills: random(5, 50),
            deaths: random(5, 50),
            demos: demos
        });
    }
}