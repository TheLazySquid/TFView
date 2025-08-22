<script lang="ts">
    import type { PlayerEncounter } from "$types/data";
    import Time from "../Time.svelte";
    import Popups from "$lib/popups";
    import InfiniteLoading from "svelte-infinite-loading";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import type { EncounterSearchParams } from "$types/search";
    import { onDestroy } from "svelte";
    import Avatar from "../player/Avatar.svelte";

    let { id }: { id: string } = $props();

    const encounters = new InfiniteList<PlayerEncounter, EncounterSearchParams>({
        listId: "encounters",
        idKey: "gameId",
        params: { id },
        filter: (encounter, params) => (
            encounter.playerId === params.id &&
            (!params.after || encounter.time > params.after) &&
            (!params.before || encounter.time < params.before) &&
            (!params.map || encounter.map.includes(params.map)) &&
            (!params.name || encounter.name.includes(params.name))
        )
    });

    onDestroy(() => encounters.destroy());
</script>

{#if encounters.total !== undefined}
    <div>{encounters.total} {encounters.total === 1 ? "encounter" : "encounters"} recorded</div>
{/if}
<div class="max-h-[400px] overflow-y-auto">
    <table class="w-full">
        <thead class="sticky top-0 bg-background">
            <tr class="*:text-left">
                <th>Time</th>
                <th></th>
                <th>Name</th>
                <th>Map</th>
                <th>K/D</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            {#each encounters.items as encounter}
                <tr>
                    <td><Time timestamp={encounter.time} type="date" /></td>
                    <td><Avatar avatarHash={encounter.avatarHash} name={encounter.name} /></td>
                    <td>{encounter.name}</td>
                    <td>{encounter.map}</td>
                    <td>{encounter.kills}/{encounter.deaths}</td>
                    <td>
                        <button class="underline"
                        onclick={() => Popups.open("game", encounter.gameId)}>
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
</div>