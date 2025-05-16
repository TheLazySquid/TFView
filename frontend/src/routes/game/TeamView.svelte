<script lang="ts">
    import Game from "$lib/game.svelte";
    import PlayerView from "./PlayerView.svelte";

    let { id, name }: { id: number, name: string } = $props();

    let team = $derived(Game.players.filter(p => p.team === id));
</script>

<div>
    <h2 class="w-full text-center text-5xl">{name}</h2>
    <div class="flex flex-col px-4">
        {#each team as player}
            <PlayerView {player} />
        {/each}
    </div>
</div>