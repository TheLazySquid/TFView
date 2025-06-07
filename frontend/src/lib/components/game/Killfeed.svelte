<script lang="ts">
    import Game from "$lib/ws/game.svelte";
    import { getWeaponImage } from "$lib/killfeed";
    import VirtualList from "svelte-tiny-virtual-list";
    import { resize } from "svelte-resize-observer-action";
    import { onMount, tick } from "svelte";
    import { killfeedBlue, killfeedRed } from "$lib/consts";
    
    let { id, height }: { id?: string, height?: number } = $props();
    let container: HTMLElement;
    let containerHeight = $state(window.innerHeight);
    let list: HTMLElement;

    onMount(() => {
        let el = container.querySelector<HTMLElement>(".virtual-list-wrapper");
        if(el) list = el;
    });

    const killfeed = $derived(id ? Game.killfeed.filter(m => m.killerId === id || m.victimId === id) : Game.killfeed);

    $effect(() => {
        killfeed.length;
        if(!list) return;
        tick().then(() => {
            if(list.scrollTop > 41) list.scrollTop += 40;
        });
    });
</script>

<div class="h-full" use:resize={(e) => containerHeight = e.contentRect.height} bind:this={container}>
    <VirtualList height={containerHeight} itemCount={killfeed.length} itemSize={40}>
        <div slot="item" let:index let:style {style}>
            {@const kill = killfeed[killfeed.length - index - 1]}
            <div class="flex items-center rounded-md pl-5 pr-5 font-bold h-8 kill mb-2 w-fit"
                class:crit={kill.crit}>
                <div class="whitespace-nowrap"
                style="color: {kill.killerTeam === 2 ? killfeedRed : killfeedBlue}">
                    {kill.killer}
                </div>
                <img class="px-4"
                src={getWeaponImage(kill.weapon, kill.crit)} alt={kill.weapon} />
                <div class="whitespace-nowrap"
                style="color: {kill.killerTeam === 2 ? killfeedBlue : killfeedRed}">
                    {kill.victim}
                </div>
            </div>
        </div>
    </VirtualList>
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