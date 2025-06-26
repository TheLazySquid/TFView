import type { PastGame } from "$types/data";
import type { GameSearchParams } from "$types/search";
import { InfiniteList } from "../infiniteList.svelte";

export default new class GameHistory {
    games = new InfiniteList<PastGame, GameSearchParams>({
        listId: "pastgames",
        idKey: "rowid",
        filter: (game, params) => (
            (!params.map || game.map.includes(params.map)) &&
            (!params.hostname || !!game.hostname && game.hostname.includes(params.hostname)) &&
            (!params.after || game.start >= params.after) &&
            (!params.before || game.start <= params.before)
        )
    });
}