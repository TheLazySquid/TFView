import type { Database } from "bun:sqlite";
import { mapNames, playerIds, playerNames, random } from "./util";

export function createFakeHistory(db: Database) {
    let start = Date.now() - 1e6;
    let recorded: boolean[] = [];

    for(let i = 0; i < 60; i++) {
        start -= random(1e6, 1e7);

        let map = mapNames[random(0, mapNames.length - 1)];
        let numPlayers = random(5, 24);
        let available = [];
        for(let i = 0; i < playerNames.length; i++) available.push(i);

        for(let j = 0; j < numPlayers; j++) {
            let availableIndex = random(0, available.length - 1);
            let index = available[availableIndex];
            available.splice(availableIndex, 1);
            let time = start + random(0, 1e5);

            if(!recorded[index]) {
                recorded[index] = true;
                db.query(`INSERT INTO players (id, lastName, lastSeen, names, encounters)
                    VALUES($id, $lastName, $lastSeen, $names, $encounters)`).run({
                    id: playerIds[index],
                    lastName: playerNames[index],
                    lastSeen: time,
                    names: JSON.stringify([playerNames[index]]),
                    // This isn't accurate, but we don't care for fake data
                    encounters: random(1, 15)
                });
            }

            let player = {
                id: playerIds[index],
                name: playerNames[index],
                time,
                deaths: random(0, 10),
                kills: random(0, 10)
            }

            db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
                VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).all({
                playerId: playerIds[index],
                name: playerNames[index],
                map: map,
                gameId: i + 1,
                time: time,
                kills: player.kills,
                deaths: player.deaths
            });
        }

        const date = new Date(start);
        let demo = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.dem`;
        let demos = JSON.stringify([demo]);

        db.query(`INSERT INTO games (map, hostname, ip, start, duration, kills, deaths, demos)
            VALUES($map, $hostname, $ip, $start, $duration, $kills, $deaths, $demos)`).run({
            map: map,
            start: start,
            duration: random(5e5, 5e6),
            hostname: "Some server " + Math.random().toString(36).slice(2),
            ip: `${random(1, 255)}.${random(1, 255)}.${random(1, 255)}.${random(1, 255)}:${random(1000, 65535)}`,
            kills: random(5, 50),
            deaths: random(5, 50),
            demos: demos
        });
    }
}