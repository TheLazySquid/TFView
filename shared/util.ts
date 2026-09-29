import { steamProfilesUrl } from "./consts";
import { id64Flags, id64ToId3 } from "./steamid";

export function isStringNumber(string: string) {
    const num = Number(string);
    return !Number.isNaN(num) && Number.isFinite(num);
}

export function toNumberStringOrNull(string: string) {
    if(!isStringNumber(string)) return null;
    return string;
}

export function resolveSteamId(input: string) {
    if(input.startsWith("[U:1:")) {
        if(input.endsWith("]")) return toNumberStringOrNull(input.slice(5, -1));
        else return toNumberStringOrNull(input.slice(5));
    }
    
    if(input.startsWith(steamProfilesUrl)) {
        return toNumberStringOrNull(input.slice(steamProfilesUrl.length).split("/", 1)[0]!);
    }

    if(!isStringNumber(input)) return null;
    if(BigInt(input) < id64Flags) return input;
    return id64ToId3(input);
}