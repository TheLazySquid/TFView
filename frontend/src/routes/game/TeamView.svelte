<script lang="ts">
    import { nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import PlayerView from "./PlayerView.svelte";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";

    let { id, name }: { id?: number, name: string } = $props();

    let team = $derived(id ? Game.players.filter(p => p.team === id) : Game.players.filter(p => p.team === 2 || p.team === 3));
</script>

<div class="w-full h-full flex flex-col items-center">
    <h2 class="w-full text-center text-5xl pb-2" style={id ? `color: ${nameColors[id]}` : ""}>{name}</h2>
    <table class="overflow-y-auto block" style={ id ? "width: 100%" : "width: min(100%, 900px)" }>
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
            {#each team as player}
                <PlayerView {player} />
            {/each}
        </tbody>
    </table>
</div>