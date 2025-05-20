<script lang="ts">
    import History from "$lib/ws/history.svelte";

    History.init();
</script>

<div>
    {#each History.pastGames as game}
        <div>{game.map}</div>
    {/each}
</div>