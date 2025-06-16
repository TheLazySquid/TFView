<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import GameHistory from "$lib/ws/gameHistory.svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import Popups from "$lib/popups";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";

    GameHistory.init();
</script>

{#snippet historyEnd()}
    End of history
{/snippet}

<PastGamePopup />
<PastPlayerPopup />

<div class="w-full h-full flex justify-center">
    <div class="overflow-y-auto" style="width: min(1000px, 90%)">
        {#if GameHistory.games.total !== undefined}
            <div>Total games recorded: {GameHistory.games.total}</div>
        {/if}
        <table class="w-full">
            <thead class="sticky top-0 bg-background">
                <tr class="*:text-left">
                    <th>Time</th>
                    <th style="width: 15%">Duration</th>
                    <th>Map</th>
                    <th style="width: 30%">Server</th>
                    <th>K/D</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                {#each GameHistory.games.items as game}
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
                        <InfiniteLoading on:infinite={GameHistory.games.infiniteHandler}>
                            <svelte:fragment slot="noResults">{@render historyEnd()}</svelte:fragment>
                            <svelte:fragment slot="noMore">{@render historyEnd()}</svelte:fragment>
                        </InfiniteLoading>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
</div>