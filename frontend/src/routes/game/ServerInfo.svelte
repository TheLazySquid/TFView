<script lang="ts">
    import Game from "$lib/ws/game.svelte";
</script>

{#if Game.currentServer}
    <div>Map: {Game.currentServer.map}</div>
    <div>Host: {Game.currentServer.hostname ?? "Unknown"}</div>
    <div>IP: {Game.currentServer.ip ?? "Unknown"}</div>
{:else}
    <h2>Not currently connected to any server</h2>
{/if}