import { join } from "node:path";
import { homedir } from "node:os";

export const dataPath = join(homedir(), ".tfview");
export const pageSize = 50;
export const compiled = !process.execPath.replaceAll("\\", "/").includes(".bun/bin/bun");
export const root = compiled ? join(process.execPath, "..") : join(Bun.main, "..", "..");

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