import { id64ToId3 } from "$shared/steamid";
import type { PastPlayer } from "$types/data";
import type { PlayerSearchParams } from "$types/search";
import { InfiniteList } from "./infiniteList.svelte";
import { PageState } from "./wsclient.svelte";

export default new class PlayerHistory extends PageState {
    type = "playerhistory";
    players = new InfiniteList<PastPlayer, PlayerSearchParams>({
        listId: "pastplayers",
        idKey: "id",
        params: { tags: [] },
        filter: (player, params) => {
            if(params.name) {
                // Allow searches for id64, id3, or name
                if(params.name.startsWith("[U:1:")) {
                    let id3 = params.name.slice(5, -1);
                    if(!isNaN(parseInt(id3))) {
                        params.id3 = id3;
                    }
                } else if(!isNaN(parseInt(params.name))) {
                    params.id64 = id64ToId3(params.name);
                    params.id3 = params.name;
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
                (params.tags.every(tag => player.tags[tag]))
            )
        }
    });
}