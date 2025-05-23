<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as Dialog from "$lib/components/ui/dialog";
    import Popups from "$lib/popups";
    import PastEncounters from "./PastEncounters.svelte";

    let player: Player | null = $state.raw(null);
    let modalOpen = $state(false);
    let zIndex = $state(50);

    Popups.openPlayerPopup = (openPlayer: Player) => {
        player = openPlayer;
        modalOpen = true;
        zIndex = Popups.zIndex++;
    }

    const teams = ["Unassigned", "Spectator", "Red", "Blue"];
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content style="z-index: {zIndex}">
        {#if player}
            <Dialog.Header class="text-2xl">{ player.name }</Dialog.Header>
            <div>Team: {teams[player.team]}</div>
            <div>Ping: {player.ping}</div>
            <div>Alive: {player.alive}</div>
            <div>Health: {player.health}</div>
            <h2>Past encounters:</h2>
            <PastEncounters id={player.accountId} />
        {/if}
    </Dialog.Content>
</Dialog.Root>