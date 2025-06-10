<script lang="ts">
    import Game from "$lib/ws/game.svelte";
    import PlayerView from "./PlayerView.svelte";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";

    let { id, name }: { id?: number, name: string } = $props();

    let team = $derived(id ? Game.players.filter(p => p.team === id) : Game.players);
</script>

<div>
    <h2 class="w-full text-center text-5xl">{name}</h2>
    <table>
        <thead>
            <tr class="*:pr-1.5">
                <th></th> 
                <th class="w-full"></th> 
                <th></th> 
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