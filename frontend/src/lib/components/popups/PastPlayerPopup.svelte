<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import PastEncounters from "../history/PastEncounters.svelte";
    import Popup from "./Popup.svelte";

    let id: string | null = $state(null);
    let name = $state("");

    const onOpen = (playerId: string, playerName: string) => {
        id = playerId;
        name = playerName;
    }
</script>

<Popup type="openPastPlayerPopup" {onOpen}>
    {#if id}
        <Dialog.Header class="text-2xl">{ name }</Dialog.Header>
        <h2>Past encounters:</h2>
        <PastEncounters {id} />
    {/if}
</Popup>