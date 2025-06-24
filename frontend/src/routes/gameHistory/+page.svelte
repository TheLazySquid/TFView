<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import GameHistory from "$lib/ws/gameHistory.svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import Popups from "$lib/popups";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import * as Search from "$lib/components/search";
    import ConfirmPopup from "$lib/components/popups/ConfirmPopup.svelte";
    import DeleteGame from "$lib/components/history/DeleteGame.svelte";


    GameHistory.init();
</script>

<title>Game History | TFView</title>

<PastGamePopup />
<PastPlayerPopup />
<ConfirmPopup />

{#snippet historyEnd()}
    End of history
{/snippet}

<div class="w-full h-full flex justify-center">
    <div class="overflow-y-auto" style="width: min(1000px, 90%)">
        <Search.SearchBox title="Search Games" singular="game" plural="games" list={GameHistory.games}>
            <div class="content-center">Map:</div>
            <Search.TextInput bind:value={GameHistory.games.params.map} />

            <div class="content-center">Server Name:</div>
            <Search.TextInput bind:value={GameHistory.games.params.hostname} />

            <div class="content-center">After:</div>
            <Search.DateInput bind:timestamp={GameHistory.games.params.after} />
            
            <div class="content-center">Before:</div>
            <Search.DateInput bind:timestamp={GameHistory.games.params.before} />
        </Search.SearchBox>
        <table class="w-full">
            <thead class="sticky top-0 bg-background">
                <tr class="*:text-left">
                    <th>Time</th>
                    <th style="width: 15%">Duration</th>
                    <th>Map</th>
                    <th style="width: 30%">Server</th>
                    <th>K/D</th>
                    <th style="width: 10%"></th>
                    <th style="width: 5%"></th>
                </tr>
            </thead>
            <tbody>
                {#each GameHistory.games.items as game}
                    <tr class="border-t-2 *:py-1">
                        <td class="whitespace-nowrap"><Time timestamp={game.start} type="date" /></td>
                        <td><Time timestamp={game.duration} type="duration" /></td>
                        <td>{game.map}</td>
                        <td>{game.hostname ?? "Unknown"}</td>
                        <td>{game.kills}/{game.deaths}</td>
                        <td>
                            <button class="underline"
                            onclick={() => Popups.openGamePopup?.(game.rowid)}>
                                Details
                            </button>
                        </td>
                        <td>
                            <DeleteGame class="h-full w-full flex justify-center items-center" {game} />
                        </td>
                    </tr>
                {/each}
                <tr>
                    <th colspan={6} class="border-t-2">
                        <InfiniteLoading on:infinite={GameHistory.games.infiniteHandler}
                            identifier={GameHistory.games.identifier}>
                            <svelte:fragment slot="noResults">{@render historyEnd()}</svelte:fragment>
                            <svelte:fragment slot="noMore">{@render historyEnd()}</svelte:fragment>
                        </InfiniteLoading>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
</div>