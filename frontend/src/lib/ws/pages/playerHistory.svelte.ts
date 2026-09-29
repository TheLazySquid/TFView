import type { PastPlayer } from "$types/data";
import type { PlayerSearchParams } from "$types/search";
import { steamVanityUrl } from "$shared/consts";
import { resolveSteamId } from "$shared/util";
import { InfiniteList } from "../infiniteList.svelte";

export default new class PlayerHistory {
    players = new InfiniteList<PastPlayer, PlayerSearchParams>({
        listId: "pastplayers",
        idKey: "id",
        params: { tags: {}, sortBy: "lastSeen" },
        filter: (player, params) => {
            if(params.sortBy === "encounters" || params.name?.startsWith(steamVanityUrl)) return false;

            return (
                (
                    !params.name || player.names.some(n => n.includes(params.name!)) ||
                    player.id === resolveSteamId(params.name) ||
                    (!!player.nickname && player.nickname.includes(params.name!))
                ) &&
                (!params.after || player.lastSeen >= params.after) &&
                (!params.before || player.lastSeen <= params.before) &&
                (Object.entries(params.tags).every(([tag, enabled]) => !enabled || player.tags[tag]))
            )
        }
    });
}