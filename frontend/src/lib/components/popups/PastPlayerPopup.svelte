<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import Popups from "$lib/popups";
    import type WSClient from "$lib/ws/wsclient";
    import PastEncounters from "./PastEncounters.svelte";

    let { ws }: { ws: WSClient<any> } = $props();
    let id: string | null = $state(null);
    let name = $state("");
    let modalOpen = $state(false);
    let zIndex = $state(50);

    Popups.openPastPlayerPopup = (playerId: string, playerName: string) => {
        id = playerId;
        name = playerName;
        modalOpen = true;
        zIndex = Popups.zIndex++;
    }
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content style="z-index: {zIndex}">
        {#if id}
            <Dialog.Header class="text-2xl">{ name }</Dialog.Header>
            <h2>Past encounters:</h2>
            <PastEncounters {id} {ws} />
        {/if}
    </Dialog.Content>
</Dialog.Root>