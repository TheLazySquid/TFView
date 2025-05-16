<script lang="ts">
    import Game from "$lib/game.svelte";
    import Killfeed from "./game/Killfeed.svelte";
    import TeamView from "./game/TeamView.svelte";

    Game.init();
</script>

{#snippet seperator()}
    <div class="bg-border w-1"></div>
{/snippet}

<div class="w-screen h-screen grid" style="grid-template-columns: 1fr auto 1fr auto 1fr;">
    <TeamView name="Red" id={2} />
    {@render seperator()}
    <TeamView name="Blue" id={3} />
    {@render seperator()}
    <Killfeed />
</div>