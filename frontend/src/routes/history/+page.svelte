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

        History.pastGames.push(...games);
        if(games.length === 0) e.detail.complete();
        else e.detail.loaded();
    }
</script>

{#snippet historyEnd()}
    End of history
{/snippet}

<PastGamePopup />
<PastPlayerPopup />

<div class="w-full flex justify-center">
    <table class="table-fixed" style="width: min(1000px, 90%)">
        <thead>
            <tr class="*:sticky *:top-0 *:bg-background *:text-left">
                <th>Time</th>
                <th style="width: 15%">Duration</th>
                <th>Map</th>
                <th style="width: 30%">Server</th>
                <th style="width: 10%"></th>
            </tr>
        </thead>
        <tbody>
            {#each History.pastGames as game}
                <tr class="border-t-2 *:py-1">
                    <td><Time date={game.start} /></td>
                    <td><Time date={game.duration} duration={true} /></td>
                    <td>{game.map}</td>
                    <td>{game.hostname ?? "Unknown"}</td>
                    <td>
                        <button class="underline"
                        onclick={() => Popups.openGamePopup?.(game.rowid)}>
                            Details
                        </button>
                    </td>
                </tr>
            {/each}
            <tr>
                <th colspan={5} class="border-t-2">
                    <InfiniteLoading on:infinite={infiniteHandler}>
                        <svelte:fragment slot="noResults">{@render historyEnd()}</svelte:fragment>
                        <svelte:fragment slot="noMore">{@render historyEnd()}</svelte:fragment>
                    </InfiniteLoading>
                </th>
            </tr>
        </tbody>
    </table>
</div>