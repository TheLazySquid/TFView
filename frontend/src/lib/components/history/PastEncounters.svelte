<script lang="ts">
    import type { PlayerEncounter } from "$types/data";
    import type { InfiniteEvent } from "svelte-infinite-loading";
    import { Recieves } from "$types/messages";
    import Time from "../Time.svelte";
    import Popups from "$lib/popups";
    import InfiniteLoading from "svelte-infinite-loading";
    import WS from "$lib/ws/wsclient.svelte";
    import { watch } from "runed";

    let { id }: { id: string } = $props();
    let encounters: PlayerEncounter[] = $state([]);
    let total: number | undefined = $state();

    watch(() => id, () => {
        encounters = [];
        total = undefined;
    });

    async function onInfinite({ detail: { complete, loaded }}: InfiniteEvent) {
        let newEncounters = await WS.sendAndRecieve(Recieves.GetEncounters, { id, offset: encounters.length });
        if(newEncounters.total !== undefined) total = newEncounters.total;
            
        encounters.push(...newEncounters.encounters);
        if(newEncounters.encounters.length === 0) complete();
        else loaded();
    }
</script>

{#if total !== undefined}
    <div>{total} encounters recorded</div>
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
        {#each encounters as encounter}
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
        <InfiniteLoading on:infinite={onInfinite} identifier={id}>
            <svelte:fragment slot="noResults">
                No past encounters
            </svelte:fragment>
            <div slot="noMore"></div>
        </InfiniteLoading>
    </tbody>
</table>