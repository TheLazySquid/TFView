<script lang="ts">
    import type { PlayerEncounter } from "$types/data";
    import type { InfiniteEvent } from "svelte-infinite-loading";
    import { Recieves } from "$types/messages";
    import Time from "../Time.svelte";
    import Popups from "$lib/popups";
    import InfiniteLoading from "svelte-infinite-loading";
    import WS from "$lib/ws/wsclient.svelte";

    let { id }: { id: string } = $props();
    let encounters: PlayerEncounter[] = $state([]);

    $effect(() => {
        id;
        encounters = [];
    });

    async function onInfinite({ detail: { complete, loaded }}: InfiniteEvent) {
        let newEncounters = await WS.sendAndRecieve(Recieves.GetEncounters,
            { id, offset: encounters.length });
        encounters.push(...newEncounters);

        if(newEncounters.length === 0) complete();
        else loaded();
    }
</script>

<table class="max-h-[400px] overflow-y-auto table-fixed w-full">
    <thead>
        <tr class="*:sticky *:top-0 *:bg-background *:text-left">
            <th class="w-[30%]">Time</th>
            <th class="w-[30%]">Name</th>
            <th class="w-[30%]">Map</th>
            <th class="w-[10%]"></th>
        </tr>
    </thead>
    <tbody>
        {#each encounters as encounter}
            <tr>
                <td><Time date={encounter.time} /></td>
                <td>{encounter.name}</td>
                <td>{encounter.map}</td>
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