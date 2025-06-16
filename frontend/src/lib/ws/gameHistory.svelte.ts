import type { PastGameEntry } from "$types/data";
import { Message } from "$types/messages";
import { InfiniteList } from "./infiniteList.svelte";
import { PageState } from "./wsclient.svelte";

export default new class GameHistory extends PageState {
    type = "gamehistory";
    games = new InfiniteList<PastGameEntry>({ listId: "pastgames", idKey: "rowid" });
}