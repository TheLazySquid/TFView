<script lang="ts">
    import Game from "$lib/game.svelte";
    import { getWeaponImage } from "$lib/killfeed";
    import VirtualList from "svelte-tiny-virtual-list";
    import { resize } from "svelte-resize-observer-action";

    let containerHeight = $state(window.innerHeight);

    const red = '#b55c4c'
    const blue = '#687d9c';
</script>

<div use:resize={(e) => containerHeight = e.contentRect.height}>
    <VirtualList height={containerHeight} itemCount={Game.killfeed.length} itemSize={40}>
        <div slot="item" let:index let:style {style}>
            {@const kill = Game.killfeed[Game.killfeed.length - index - 1]}
            <div class="flex items-center rounded-md pl-5 pr-5 font-bold h-8 kill mb-2 w-fit"
                class:crit={kill.crit}>
                <div class="whitespace-nowrap"
                style="color: {kill.killerTeam === 2 ? red : blue}">
                    {kill.killer}
                </div>
                <img class="px-4"
                src={getWeaponImage(kill.weapon, kill.crit)} alt={kill.weapon} />
                <div class="whitespace-nowrap"
                style="color: {kill.killerTeam === 2 ? blue : red}">
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