import type { PastPlayer } from "$types/data";
import type { PlayerSearchParams } from "$types/search";
import { InfiniteList } from "./infiniteList.svelte";
import { PageState } from "./wsclient.svelte";

export default new class PlayerHistory extends PageState {
    type = "playerhistory";
    players = new InfiniteList<PastPlayer, PlayerSearchParams>({
        listId: "pastplayers",
        idKey: "id",
        params: { tags: [] }
    });
}