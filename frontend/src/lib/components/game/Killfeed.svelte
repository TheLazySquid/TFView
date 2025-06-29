<script lang="ts">
    import type { KillfeedEntry } from "$types/lobby";
    import { getWeaponImage } from "$lib/killfeed";
    import { onDestroy, onMount } from "svelte";
    import { killfeedBlue, killfeedRed } from "$lib/consts";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import type { KillfeedSearchParams } from "$types/search";
    import InfiniteLoading from "svelte-infinite-loading";
    import Time from "$lib/components/Time.svelte";
    import Game from "$lib/ws/pages/game.svelte";
    import Select from "../search/Select.svelte";
    
    let { id }: { id?: string } = $props();

    const kills = new InfiniteList<KillfeedEntry, KillfeedSearchParams>({
        listId: "killfeed",
        filter: (item, params) => {
            if(!params.id) return true;
            return item.killerId === params.id || item.victimId === params.id;
        },
        params: { id, type: "all" },
        reverse: true
    });

    let scrollContainer: HTMLElement;
    onMount(() => kills.setScrollContainer(scrollContainer));
    onDestroy(() => kills.destroy());
</script>

<div class="h-full flex flex-col min-h-0">
    <div class="grow min-h-0 overflow-y-auto grid auto-rows-max gap-2" bind:this={scrollContainer}
        style="grid-template-columns: auto 1fr">
        <div class="col-span-2">
            <InfiniteLoading on:infinite={kills.infiniteHandler} direction="top"
                identifier={kills.identifier}>
                <div slot="noResults"></div>
                <div slot="noMore"></div>
            </InfiniteLoading>
        </div>
        {#if kills.items.length === 0}
            <div class="col-span-2 text-center text-zinc-400">
                {#if kills.params.type === "all"}
                    No Kill/Deaths Recorded
                {:else if kills.params.type === "kill"}
                    No Kills Recorded
                {:else if kills.params.type === "death"}
                    No Deaths Recorded
                {/if}
            </div>
        {/if}
        {#each kills.items as kill}
            {@const killer = Game.playersMap.get(kill.killerId)}
            {@const victim = Game.playersMap.get(kill.victimId)}
            <div class="text-zinc-400 content-center whitespace-nowrap"><Time timestamp={kill.timestamp} type="time" /></div>
            <div class="flex items-center rounded-md pl-5 pr-5 font-bold h-8 kill w-fit"
                class:crit={kill.crit}>
                <button class="whitespace-nowrap" onclick={() => Game.openPlayer(kill.killerId)}
                style="color: {kill.killerTeam === 2 ? killfeedRed : killfeedBlue}" class:italic={killer?.nickname}>
                    {killer?.nickname ?? kill.killer}
                </button>
                <img class="px-4" src={getWeaponImage(kill.weapon, kill.crit)} alt={kill.weapon} />
                <button class="whitespace-nowrap" onclick={() => Game.openPlayer(kill.victimId)}
                style="color: {kill.killerTeam === 2 ? killfeedBlue : killfeedRed}" class:italic={victim?.nickname}>
                    {victim?.nickname ?? kill.victim}
                </button>
            </div>
        {/each}
    </div>
    {#if id}
        <div class="flex items-center gap-3">
            Type:
            <Select bind:value={kills.params.type} options={{
                all: "All",
                kill: "Kills",
                death: "Deaths"
            }} class="w-[200px]" onChange={() => kills.resetSearch()} />
        </div>
    {/if}
</div>

<style>
    .kill {
        background-color: #e3d2b2;
        font-family: Verdana, sans-serif;
    }

    .kill.crit img {
        background-image: url('/killfeed/Crit_bg.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 40px;
    }
</style>