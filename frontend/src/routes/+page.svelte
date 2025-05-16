<script lang="ts">
    import Game from "$lib/game.svelte";

    Game.init();
</script>

<div>
    {JSON.stringify(Game.players)}
</div>