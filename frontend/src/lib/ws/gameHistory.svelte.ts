import type { PastGameEntry } from "$types/data";
import type { GameSearchParams } from "$types/search";
import { InfiniteList } from "./infiniteList.svelte";
import { PageState } from "./wsclient.svelte";

export default new class GameHistory extends PageState {
    type = "gamehistory";
    games = new InfiniteList<PastGameEntry, GameSearchParams>({
        listId: "pastgames",
        idKey: "rowid"
    });
}