<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import Popups from "$lib/popups";
    import PastEncounters from "./PastEncounters.svelte";
    import Chat from "../game/Chat.svelte";
    import InfoIcon from "@lucide/svelte/icons/user";
    import HistoryIcon from "@lucide/svelte/icons/folder-clock";
    import ChatIcon from "@lucide/svelte/icons/message-square-more"
    import KillfeedIcon from "@lucide/svelte/icons/swords";
    import Killfeed from "../game/Killfeed.svelte";

    let player: Player | null = $state.raw(null);
    let modalOpen = $state(false);
    let zIndex = $state(50);

    Popups.openPlayerPopup = (openPlayer: Player) => {
        player = openPlayer;
        modalOpen = true;
        zIndex = Popups.zIndex++;
    }

    const teams = ["Unassigned", "Spectator", "Red", "Blue"];
    let tab = $state("info");
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content class="min-h-[450px] flex flex-col *:nth-[2]:flex-grow"
    style="max-width: min(700px, 85%); z-index: {zIndex}">
        {#if player}
            <Dialog.Header class="text-2xl">{ player.name }</Dialog.Header>
            <Tabs.Root bind:value={tab}>
                <Tabs.List class="w-full">
                    <Tabs.Trigger value="info"><InfoIcon /></Tabs.Trigger>
                    <Tabs.Trigger value="encounters"><HistoryIcon /></Tabs.Trigger>
                    <Tabs.Trigger value="chat"><ChatIcon /></Tabs.Trigger>
                    <Tabs.Trigger value="kills"><KillfeedIcon /></Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="info">
                    <div>Team: {teams[player.team]}</div>
                    <div>Ping: {player.ping}</div>
                    <div>Alive: {player.alive}</div>
                    <div>Health: {player.health}</div>
                </Tabs.Content>
                <Tabs.Content value="encounters">
                    <!-- Required for infinite loading for some reason -->
                    {#if tab === "encounters"}
                        <PastEncounters id={player.accountId} />
                    {/if}
                </Tabs.Content>
                <Tabs.Content value="chat">
                    <Chat id={player.userId} />
                </Tabs.Content>
                <Tabs.Content value="kills" class="grid">
                    <Killfeed id={player.userId} />
                </Tabs.Content>
            </Tabs.Root>
        {/if}
    </Dialog.Content>
</Dialog.Root>