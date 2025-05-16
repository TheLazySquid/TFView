<script lang="ts">
    import type { Player } from "$types/lobby";

    let { player }: { player: Player } = $props();
</script>

<div class="bg-accent">
    {player.name}
</div>