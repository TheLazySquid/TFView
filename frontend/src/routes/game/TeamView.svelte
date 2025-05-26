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
    <div class="grid px-4 gap-1 items-center justify-center"
    style="grid-template-columns: auto 1fr auto 36px 36px">
        <div></div>
        <div></div>
        <div class="text-center">K/D</div>
        <div class="flex justify-center"><HeartPulse /></div>
        <div class="flex justify-center"><Ping /></div>
        {#each team as player}
            <PlayerView {player} />
        {/each}
    </div>
</div>