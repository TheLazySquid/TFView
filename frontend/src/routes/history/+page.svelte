<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import History from "$lib/ws/history.svelte";
    import { Recieves } from "$types/messages";
    import InfiniteLoading, { type InfiniteEvent } from "svelte-infinite-loading";
    import Popups from "$lib/popups";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import WS from "$lib/ws/wsclient.svelte";

    History.init();

    async function infiniteHandler(e: InfiniteEvent) {
        let games = await WS.sendAndRecieve(Recieves.GetGames, History.pastGames.length);
        if(games.total !== undefined) History.totalGames = games.total;

        History.pastGames.push(...games.games);
        if(games.games.length === 0) e.detail.complete();
        else e.detail.loaded();
    }
</script>

{#snippet historyEnd()}
    End of history
{/snippet}

<PastGamePopup />
<PastPlayerPopup />

<div class="w-full h-full flex justify-center">
    <div class="overflow-y-auto" style="width: min(1000px, 90%)">
        {#if History.totalGames}
            <div>Total games recorded: {History.totalGames}</div>
        {/if}
        <table class="w-full">
            <thead>
                <tr class="*:sticky *:top-0 *:bg-background *:text-left">
                    <th>Time</th>
                    <th style="width: 15%">Duration</th>
                    <th>Map</th>
                    <th style="width: 30%">Server</th>
                    <th>K/D</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                {#each History.pastGames as game}
                    <tr class="border-t-2 *:py-1">
                        <td class="whitespace-nowrap"><Time date={game.start} /></td>
                        <td><Time date={game.duration} duration={true} /></td>
                        <td>{game.map}</td>
                        <td>{game.hostname ?? "Unknown"}</td>
                        <td>{game.kills}/{game.deaths}</td>
                        <td>
                            <button class="underline"
                            onclick={() => Popups.openGamePopup?.(game.rowid)}>
                                Details
                            </button>
                        </td>
                    </tr>
                {/each}
                <tr>
                    <th colspan={6} class="border-t-2">
                        <InfiniteLoading on:infinite={infiniteHandler}>
                            <svelte:fragment slot="noResults">{@render historyEnd()}</svelte:fragment>
                            <svelte:fragment slot="noMore">{@render historyEnd()}</svelte:fragment>
                        </InfiniteLoading>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
</div>