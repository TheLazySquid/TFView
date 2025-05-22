<script lang="ts">
    import Popups from "$lib/popups";
    import type { Player } from "$types/lobby";

    let { player }: { player: Player } = $props();
</script>

<button class="bg-accent" onclick={() => Popups.openPlayerPopup?.(player)}>
    {player.name}
</button>