<script lang="ts">
    import Game from "$lib/game.svelte";
    import TeamView from "./game/TeamView.svelte";

    Game.init();
</script>

<div class="w-screen h-screen grid" style="grid-template-columns: 1fr auto 1fr;">
    <TeamView name="Red" id={2} />
    <div class="bg-border w-1"></div>
    <TeamView name="Blue" id={3} />
</div>