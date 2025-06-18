import type { StoredPlayer } from "$types/data";
import type { PlayerSearchParams } from "$types/search";
import { InfiniteList } from "./infiniteList.svelte";
import { PageStateWithTags } from "./wsclient.svelte";

export default new class PlayerHistory extends PageStateWithTags {
    type = "playerhistory";
    players = new InfiniteList<StoredPlayer, PlayerSearchParams>({
        listId: "pastplayers",
        idKey: "id"
    });
}