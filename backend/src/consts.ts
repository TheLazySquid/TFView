import { join } from "node:path";
import { homedir } from "node:os";

// Read flags
export let flags = {
    fakeData: false,
    noNet: false,
    noMAC: false,
    noSteamApi: false
}

for(const arg of Bun.argv) {
    if(!arg.startsWith("--")) continue;
    const flag = arg.slice(2);

    if(!(flag in flags)) throw new Error(`Unknown flag: ${flag}`);
    flags[flag] = true;
}

// Disable both MAC and steamApi if noNet is set
if(flags.noNet) {
    flags.noMAC = true;
    flags.noSteamApi = true;
}

export const dataPath = join(homedir(), ".tfview");