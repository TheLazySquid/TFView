<script lang="ts">
    import type { KillfeedEntry } from "$types/lobby";
    import { getWeaponImage } from "$lib/killfeed";
    import { onDestroy, onMount } from "svelte";
    import { killfeedBlue, killfeedRed } from "$lib/consts";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import type { KillfeedSearchParams } from "$types/search";
    import InfiniteLoading from "svelte-infinite-loading";
    
    let { id }: { id?: string } = $props();

    const kills = new InfiniteList<KillfeedEntry, KillfeedSearchParams>({
        listId: "killfeed",
        filter: (item, params) => {
            if(!params.id) return true;
            return item.killerId === params.id || item.victimId === params.id;
        },
        params: { id },
        reverse: true
    });

    let scrollContainer: HTMLElement;
    onMount(() => kills.setScrollContainer(scrollContainer));
    onDestroy(() => kills.destroy());
</script>

<div class="h-full min-h-0 overflow-y-auto" bind:this={scrollContainer}>
    <InfiniteLoading on:infinite={kills.infiniteHandler} direction="top">
        <div slot="noResults"></div>
        <div slot="noMore"></div>
    </InfiniteLoading>
    {#each kills.items as kill}
        <div class="flex items-center rounded-md pl-5 pr-5 font-bold h-8 kill mb-2 w-fit"
            class:crit={kill.crit}>
            <div class="whitespace-nowrap"
            style="color: {kill.killerTeam === 2 ? killfeedRed : killfeedBlue}">
                {kill.killer}
            </div>
            <img class="px-4" src={getWeaponImage(kill.weapon, kill.crit)} alt={kill.weapon} />
            <div class="whitespace-nowrap"
            style="color: {kill.killerTeam === 2 ? killfeedBlue : killfeedRed}">
                {kill.victim}
            </div>
        </div>
    {/each}
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