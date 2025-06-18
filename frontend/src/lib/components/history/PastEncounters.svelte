<script lang="ts">
    import type { PlayerEncounter } from "$types/data";
    import Time from "../Time.svelte";
    import Popups from "$lib/popups";
    import InfiniteLoading from "svelte-infinite-loading";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import type { EncounterSearchParams } from "$types/search";
    import { onDestroy } from "svelte";

    let { id }: { id: string } = $props();

    const encounters = new InfiniteList<PlayerEncounter, EncounterSearchParams>({
        listId: "encounters",
        idKey: "gameId",
        params: { id }
    });

    onDestroy(() => encounters.destroy());
</script>

{#if encounters.total !== undefined}
    <div>{encounters.total} encounters recorded</div>
{/if}
<table class="max-h-[400px] overflow-y-auto w-full">
    <thead class="sticky top-0">
        <tr class="*:text-left">
            <th>Time</th>
            <th>Name</th>
            <th>Map</th>
            <th>K/D</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        {#each encounters.items as encounter}
            <tr>
                <td><Time date={encounter.time} /></td>
                <td>{encounter.name}</td>
                <td>{encounter.map}</td>
                <td>{encounter.kills}/{encounter.deaths}</td>
                <td>
                    <button class="underline"
                    onclick={() => Popups.openGamePopup?.(encounter.gameId)}>
                        Details
                    </button>
                </td>
            </tr>
        {/each}
        <InfiniteLoading on:infinite={encounters.infiniteHandler} identifier={id}>
            <svelte:fragment slot="noResults">
                No past encounters
            </svelte:fragment>
            <div slot="noMore"></div>
        </InfiniteLoading>
    </tbody>
</table>