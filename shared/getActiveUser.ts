import { parse } from "vdf-parser";
import { id64ToId3 } from "./steamid";

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
	return id64ToId3(id64);
}