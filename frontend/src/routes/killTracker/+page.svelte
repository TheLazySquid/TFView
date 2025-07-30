<script lang="ts">
    import { getWeaponImage } from "$lib/killfeed";
    import KillTracker from "$lib/ws/pages/killTracker.svelte";
    import WS from "$lib/ws/wsclient.svelte";

    WS.init("killcounts");
</script>

<svelte:head>
	<title>Weapon Kill Counts | TFView</title>
</svelte:head>

<div class="flex flex-col items-center max-h-full overflow-y-auto gap-2">
    {#each Object.entries(KillTracker.counts) as [weapon, count]}
        <div class="weapon flex items-center rounded-md px-2 h-[35px]">
            <div class="w-[200px]">
                <img alt={weapon} src={getWeaponImage(weapon, false)} />
            </div>
            <div class="text-zinc-900 w-[150px]">
                {count[0]}
            </div>
        </div>
    {/each}
</div>

<style>
    .weapon {
        background-color: #e3d2b2;
        font-family: Verdana, sans-serif;
    }
</style>