import { steamProfilesUrl, steamVanityUrl } from "$shared/consts";
import { id64ToId3 } from "$shared/steamid";
import { isStringNumber } from "$shared/util";
import type { PastPlayer } from "$types/data";
import type { PlayerSearchParams } from "$types/search";
import { InfiniteList } from "../infiniteList.svelte";

export default new class PlayerHistory {
    players = new InfiniteList<PastPlayer, PlayerSearchParams>({
        listId: "pastplayers",
        idKey: "id",
        params: { tags: {}, sortBy: "lastSeen" },
        filter: (player, params) => {
            if(params.sortBy === "encounters" || params.name?.startsWith(steamVanityUrl)) return false;

            if(params.name) {
                // Allow searches for id64, id3, or name
                if(params.name.startsWith("[U:1:")) {
                    let id3 = params.name.slice(5, -1);
                    if(isStringNumber(id3)) params.id3 = id3;
                } else if(isStringNumber(params.name)) {
                    params.id64 = id64ToId3(params.name);
                    params.id3 = params.name;
                } else if(params.name.startsWith(steamProfilesUrl)) {
                    const id64 = params.name.slice(steamProfilesUrl.length).split("/", 1)[0];
                    if(isStringNumber(id64)) params.id64 = id64ToId3(id64);
                }
            }

            return (
                (
                    !params.name || player.names.some(n => n.includes(params.name!)) ||
                    player.id === params.id3 ||
                    player.id === params.id64 ||
                    (!!player.nickname && player.nickname.includes(params.name!))
                ) &&
                (!params.after || player.lastSeen >= params.after) &&
                (!params.before || player.lastSeen <= params.before) &&
                (Object.entries(params.tags).every(([tag, enabled]) => !enabled || player.tags[tag]))
            )
        }
    });
}