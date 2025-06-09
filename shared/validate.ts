import fs from "fs";
import { join, basename } from "path";

export function validateSteamPath(path: string) {
    if(basename(path) !== "Steam") return false;
    if(!fs.existsSync(path)) return false;
    if(checkMissingChildren(path, ["userdata", "config"])) return false;
    return true;
}

export function validateTfPath(path: string) {
    if(basename(path) !== "tf") return false;
    if(!fs.existsSync(path)) return false;
    if(checkMissingChildren(path, ["tf2_misc_dir.vpk", "steam.inf"])) return false;
    return true;
}

function checkMissingChildren(path: string, children: string[]) {
    for(let child of children) {
        if(!fs.existsSync(join(path, child))) return true;
    }
    
    return false;
}