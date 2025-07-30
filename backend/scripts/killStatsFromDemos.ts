import Settings from "src/settings/settings";
import HistoryDatabase from "src/history/database";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import type { ParsedDemo } from "$types/data";
import { MultiBar, Presets } from "cli-progress";
import { getCurrentUserId } from "src/util";
import Values from "src/settings/values";

// This is unable to tell whether kills were crits or not
await Settings.init();
await Values.init();
HistoryDatabase.createDb();

const steamId = await getCurrentUserId();
const demosPath = join(Settings.get("tfPath"), "demos");
const demos = readdirSync(demosPath).filter(file => file.endsWith(".dem"));

// Check if there's already saved progress
const progressFile = Bun.file("scripts/demoParseProgress.json");
let parsed = 0;
if(await progressFile.exists()) {
    parsed = (await progressFile.json()).filesParsed;
}

if(!Values.get("killCounts")) Values.set("killCounts", {});
let killCounts = Values.get("killCounts");

const multi = new MultiBar({
    format: "{bar} | {filename} | {value}/{total}"
}, Presets.shades_grey);
const bar = multi.create(demos.length, parsed, { filename: demos[parsed] });

while(parsed < demos.length) {
    bar.update(parsed, { filename: demos[parsed] });
    recordDemo(demos[parsed]);

    parsed++;
    await progressFile.write(JSON.stringify({ filesParsed: parsed }));
}

await progressFile.delete();
multi.stop();

function recordDemo(name: string) {
    // Assumes you have https://codeberg.org/demostf/parser installed
    const command = `parse_demo "${join(demosPath, name)}"`;
    
    try {
        const output: ParsedDemo = JSON.parse(execSync(command).toString());
    
        let playerId = 0;

        for(let player of Object.values(output.users)) {
            let id3 = player.steamId.slice(5, -1); // Remove [U:1: and ]
            if(id3 === steamId) playerId = player.userId;
        }

        // Get the playerid from our name in the header otherwise
        if(!playerId) {
            for(let player of Object.values(output.users)) {
                if(player.name === output.header.nick) {
                    playerId = player.userId;
                    break;
                }
            }
        }

        for(let kill of output.deaths) {
            if(kill.killer !== playerId) continue;
            // ignore bots
            if(!kill.victim || output.users[kill.victim].steamId.length <= 7) continue;

            killCounts[kill.weapon] ??= [0, 0];
            killCounts[kill.weapon][0]++;
        }

        Values.save();
    } catch(e) {
        multi.log(`Failed to parse demo: ${name}`);
    }
}