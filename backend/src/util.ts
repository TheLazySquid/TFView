import { parse } from "vdf-parser";
import { id64ToId3 } from "$shared/steamid";
import Settings from "./settings/settings";
import { join } from "node:path";
import fsp from "node:fs/promises";

export async function getCurrentUserId() {
    const steamPath = Settings.get("steamPath");
	if(!steamPath) return null;

    const loginusersPath = join(steamPath, "config", "loginusers.vdf");
    let loginusers = (await fsp.readFile(loginusersPath)).toString();

    const vdf = parse<any>(loginusers);
	let id64: string | null = null;
	let mostRecent = 0;

	for(let [id, data] of Object.entries<any>(vdf.users)) {
		if(data.Timestamp > mostRecent) {
			mostRecent = data.Timestamp;
			id64 = id;
		}
	}

	if(!id64) return null;
	return id64ToId3(id64);
}