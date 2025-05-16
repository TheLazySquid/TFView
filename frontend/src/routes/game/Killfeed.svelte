<script lang="ts">
    import Game from "$lib/game.svelte";
    import { getWeaponImage } from "$lib/killfeed";

    const red = '#b55c4c'
    const blue = '#687d9c';
</script>

<div class="overflow-y-auto w-full">
    <div class="flex flex-col items-start gap-2">
        {#each Game.killfeed as kill}
            <div class="flex items-center rounded-md pl-5 pr-5 font-bold h-8 kill" class:crit={kill.crit}>
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
        {/each}
    </div>
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