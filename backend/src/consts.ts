import { join } from "node:path";
import { homedir } from "node:os";
import { feature } from "bun:bundle";

export const dataPath = join(homedir(), ".tfview");
export const pageSize = 50;
export const root = feature("COMPILED") ? join(process.execPath, "..") : join(Bun.main, "..", "..");
export const isLinux = process.platform === "linux";

// Read flags
export let flags = {
    fakeData: false,
    noNet: false,
    noMAC: false,
    noSteamApi: false,
    noUpdateCheck: false
}

for(const arg of Bun.argv) {
    if(!arg.startsWith("--")) continue;
    const flag = arg.slice(2);

    if(!(flag in flags)) throw new Error(`Unknown flag: ${flag}`);
    flags[flag] = true;
}

// Disable both MAC and steamApi if noNet or fakeData is set
if(flags.noNet || flags.fakeData) {
    flags.noMAC = true;
    flags.noSteamApi = true;
    flags.noUpdateCheck = true;
}