import type { PastPlayer, PlayerEncounter } from "$types/data";
import HistoryDatabase from "$src/history/database";

HistoryDatabase.init();
let playerOffset = 0;
let players: PastPlayer[] = [];

do {
    players = await HistoryDatabase.getPlayers(playerOffset, { tags: {}, sortBy: "lastSeen" });
    playerOffset += players.length;

    for(const player of players) {
        let names: string[] = [];
        let encounterOffset = 0;
        let encounters: PlayerEncounter[] = [];
        
        do {
            encounters = HistoryDatabase.getEncounters(encounterOffset, { id: player.id });
            encounterOffset += encounters.length;

            for(const encounter of encounters) {
                if(!names.includes(encounter.name)) {
                    names.push(encounter.name);
                }
            }
        } while(encounters.length > 0);

        if(names.length > 1) names = names.filter(name => name !== "unconnected");
        names.reverse();

        HistoryDatabase.db.query(`UPDATE players SET names = $names WHERE id = $id`)
            .run({ id: player.id, names: JSON.stringify(names) });
    }
} while(players.length > 0);