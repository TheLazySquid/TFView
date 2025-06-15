<script lang="ts">
    import { nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import PlayerView from "./PlayerView.svelte";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";

    let { ids = [2, 3], name }: { ids?: number[], name: string } = $props();

    // Nasty hack to get around some warnings
    let playerIndexes = $derived(Game.players.map((p, i) => ({ p, i })).filter(({ p }) => ids.includes(p.team)).map(({ i }) => i));
</script>

<div class="w-full h-full flex flex-col items-center">
    <h2 class="w-full text-center text-5xl pb-2" style={ids.length === 1 ? `color: ${nameColors[ids[0]]}` : ""}>{name}</h2>
    <table class="overflow-y-auto block" style={ ids.length === 1 ? "width: 100%" : "width: min(100%, 900px)" }>
        <thead class="sticky top-0 bg-background">
            <tr class="*:pr-1.5">
                <th class="min-w-10"></th> 
                <th class="w-full"></th> 
                <th class="min-w-8"></th> 
                <th class="whitespace-nowrap">K/D</th> 
                <th class="w-9"><div class="flex w-full h-full items-center justify-center"><HeartPulse /></div></th> 
                <th class="w-9"><div class="flex w-full h-full items-center justify-center"><Ping /></div></th> 
            </tr>
        </thead>
        <tbody class="[&>tr>td]:pr-1.5">
            {#each playerIndexes as index}
                <PlayerView {index} />
            {/each}
        </tbody>
    </table>
</div>