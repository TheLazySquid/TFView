import fsp from "node:fs/promises";
import { join } from "path";

// If you use a loadout bind, (aka a resup bind or b4nny bind), you'll know that it won't save your active loadouts between restarts
// This script lets you save the changes by echoing "tfview.saveloadout(class, loadout)" in the console
// assuming you have a file "tf/cfg/initloadouts.cfg" with the following structure:
// alias scoutRespawn "loadout1"
// alias soldierRespawn "loadout1"
// ...etc...
const classes = [
    "scout",
    "soldier",
    "pyro",
    "demo",
    "heavy",
    "engineer",
    "medic",
    "sniper",
    "spy",
]

export async function run(context, className, loadout) {
    const index = classes.indexOf(className);
    if(index === -1) {
        context.log.error(`${className} is not a valid class`);
        return;
    }

    // Read the existing config
    const path = join(context.tfPath, "cfg", "initloadouts.cfg");
    const content = await fsp.readFile(path, "utf-8");
    const lines = content.split("\n");

    // Update and write the content
    lines[index] = `alias ${className}Respawn "loadout${loadout}"`;
    await fsp.writeFile(path, lines.join("\n"), "utf-8");
    context.log.info(`Saved loadout ${loadout} for class ${className}`);
}