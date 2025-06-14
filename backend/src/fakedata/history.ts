import type { PastGamePlayer } from "$types/data";
import type { Database } from "bun:sqlite";
import { mapNames, playerIds, playerNames, random } from "./util";

export function createFakeHistory(db: Database) {
    let start = Date.now() - 1e6;
    for(let i = 0; i < 60; i++) {
        start -= random(1e6, 1e7);

        let map = mapNames[random(0, mapNames.length - 1)];
        let numPlayers = random(5, 24);
        let players: PastGamePlayer[] = [];
        let available = [];
        for(let i = 0; i < playerNames.length; i++) available.push(i);

        for(let j = 0; j < numPlayers; j++) {
            let availableIndex = random(0, available.length - 1);
            let index = available[availableIndex];
            available.splice(availableIndex, 1);

            let time = start + random(0, 1e5);
            let player = {
                id: playerIds[index],
                name: playerNames[index],
                time,
                deaths: random(0, 10),
                kills: random(0, 10)
            }
            players.push(player);

            db.query(`INSERT INTO encounters (playerId, map, name, gameId, time, kills, deaths)
                VALUES($playerId, $map, $name, $gameId, $time, $kills, $deaths)`).all({
                $playerId: playerIds[index],
                $name: playerNames[index],
                $map: map,
                $gameId: i + 1,
                $time: time,
                $kills: player.kills,
                $deaths: player.deaths
            });
        }

        db.query(`INSERT INTO games (map, hostname, ip, start, duration, players, kills, deaths)
            VALUES($map, $hostname, $ip, $start, $duration, $players, $kills, $deaths)`).run({
            $map: map,
            $players: JSON.stringify(players),
            $start: start,
            $duration: random(5e5, 5e6),
            $hostname: "Some server " + Math.random().toString(36).slice(2),
            $ip: `${random(1, 255)}.${random(1, 255)}.${random(1, 255)}.${random(1, 255)}:${random(1000, 65535)}`,
            $kills: random(5, 50),
            $deaths: random(5, 50)
        });
    }
}