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
            players.push({
                id: playerIds[index],
                name: playerNames[index],
                time
            });
            db.query(`INSERT INTO encounters (playerId, map, name, gameId, time)
                VALUES($playerId, $map, $name, $gameId, $time)`).all({
                $playerId: playerIds[index],
                $name: playerNames[index],
                $map: map,
                $gameId: i + 1,
                $time: time
            });
        }

        db.query(`INSERT INTO games (map, start, duration, players)
            VALUES($map, $start, $duration, $players)`).run({
            $map: map,
            $players: JSON.stringify(players),
            $start: start,
            $duration: random(5e5, 5e6)
        });
    }
}