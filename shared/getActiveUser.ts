import SteamID from "steamid";
import { parse } from "vdf-parser";

export default function getActiveUser(loginusers: string) {
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

	const steamId = new SteamID(id64);
	let id = steamId.getSteam3RenderedID();

	// Remove the [U:1: and ]
	return id.slice(5, -1);
}