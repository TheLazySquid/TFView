import { parse } from "vdf-parser";
import { id64ToId3 } from "$shared/steamid";
import Settings from "./settings/settings";
import { join } from "node:path";
import fsp from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";

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

export function createWatcher(path: string, callback: (event: "rename" | "change", file: string) => void) {
	let watcher: FSWatcher | null = null;
	let watchTimeout: Timer | null = null;

	const watchDemos = () => {
		if(!Settings.get("tfPath")) return;
		const fullPath = join(Settings.get("tfPath"), path);

		try {
			watcher = watch(fullPath, null, (event, file) => {
				callback(event, file.toString());
			});
		} catch {
			watchTimeout = setTimeout(() => watchDemos(), 5000);
		}
	}

	const close = () => {
		if(watcher) watcher.close();
		if(watchTimeout) clearTimeout(watchTimeout);
		watcher = null;
		watchTimeout = null;
	}

	watchDemos();
	Settings.on("tfPath", () => {
		close();
		watchDemos();
	});

	return close;
}