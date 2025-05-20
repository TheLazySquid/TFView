<script lang="ts">
    import History from "$lib/ws/history.svelte";
    import { HistoryRecieves } from "$types/messages";
    import InfiniteLoading, { type InfiniteEvent } from "svelte-infinite-loading";

    History.init();

    async function infiniteHandler(e: InfiniteEvent) {
        await History.ready;
        let games = await History.sendAndRecieve(HistoryRecieves.GetGames, History.pastGames.length);

        History.pastGames.push(...games);
        if(games.length === 0) e.detail.complete();
        else e.detail.loaded();
    }
</script>

<div>
    {#each History.pastGames as game}
        <div>{game.map}</div>
    {/each}

    <InfiniteLoading on:infinite={infiniteHandler}>
        <svelte:fragment slot="noResults">End of history</svelte:fragment>
        <svelte:fragment slot="noMore">End of history</svelte:fragment>
    </InfiniteLoading>
</div>