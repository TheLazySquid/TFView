<script lang="ts">
    import { getWeaponImage, knownIcons } from "$lib/killfeed";
    import KillTracker from "$lib/ws/pages/killTracker.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";

    WS.init("killcounts");
</script>

<svelte:head>
	<title>Weapon Kill Counts | TFView</title>
</svelte:head>

{#snippet iconCount(id: string, crit: boolean, count: number)}
    <div class="flex items-center h-[35px] text-zinc-900">
        <div class="w-[280px] text-left sm:block hidden">
            {knownIcons[id] ?? id} {#if crit}(Crit){/if}
        </div>
        <div class="w-[150px]">
            <img class:crit={crit} alt={id} src={getWeaponImage(id, crit)} />
        </div>
        <div class="w-[150px] text-left">
            {count}
        </div>
    </div>
{/snippet}

<div class="flex flex-col items-center max-h-full overflow-y-auto gap-2">
    {#if KillTracker.weaponsLoaded}
        {#if KillTracker.weapons.length === 0}
            <h2 class="text-zinc-50 text-3xl pt-3">No kills recorded!</h2>
            <h3 class="text-zinc-50 text-xl">Play some games with TFView active to record your weapon usage.</h3>
        {/if}
        {#each KillTracker.weapons as weapon}
            {@const total = KillTracker.getTotal(weapon)}
            <button class="weapon rounded-md px-2 relative" title={weapon.id}
                onclick={() => weapon.expanded = !weapon.expanded}>
                <div class="flex items-center h-[35px] text-zinc-900">
                    <div class="w-[280px] text-left sm:block hidden">
                        {knownIcons[weapon.id] ?? weapon.id}
                    </div>
                    <div class="w-[150px]">
                        <img alt={weapon.id} src={getWeaponImage(weapon.id, false)} />
                    </div>
                    <div class="w-[150px] text-left">
                        {weapon.expanded ? weapon.noncrit : total}
                    </div>
                    <div>
                        {#if weapon.expanded}
                            <ChevronDown color="black" />
                        {:else}
                            <ChevronRight color="black" />
                        {/if}
                    </div>
                </div>
                {#if weapon.expanded}
                    {@render iconCount(weapon.id, true, weapon.crit)}
                    {#if weapon.merge}
                        {#each weapon.merge as merge}
                            {@render iconCount(merge.id, false, merge.noncrit)}
                            {@render iconCount(merge.id, true, merge.crit)}
                        {/each}
                    {/if}
    
                    <div class="absolute bottom-2 right-2 text-zinc-900">
                        = {total}
                    </div>
                {/if}
            </button>
        {/each}
    {:else}
        <h2 class="text-zinc-50 text-2xl pt-3">Loading...</h2>
    {/if}
</div>

<style>
    .weapon {
        background-color: #e3d2b2;
        font-family: Verdana, sans-serif;
    }

    .crit {
        background-image: url('/killfeed/Crit_bg.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 40px;
    }
</style>