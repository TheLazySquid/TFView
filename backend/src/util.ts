import { parse } from "vdf-parser";
import { id64ToId3 } from "$shared/steamid";
import Settings from "./settings/settings";
import { join } from "node:path";
import { readFile, access, constants } from "node:fs/promises";

export async function getCurrentUserId() {
    const steamPath = Settings.get("steamPath");
	if(!steamPath) return null;

	try {		
		const loginusersPath = join(steamPath, "config", "loginusers.vdf");
		const loginusers = (await readFile(loginusersPath)).toString();
	
		const vdf = parse<any>(loginusers);
		let id64: string | null = null;
		let mostRecent = 0;
	
		for(const [id, data] of Object.entries<any>(vdf.users)) {
			if(data.Timestamp > mostRecent) {
				mostRecent = data.Timestamp;
				id64 = id;
			}
		}
	
		if(!id64) return null;
		return id64ToId3(id64);
	} catch {
		return null;
	}
}

export async function exists(path: string) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}