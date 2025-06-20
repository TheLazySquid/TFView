<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import PastEncounters from "../history/PastEncounters.svelte";
    import Chat from "../game/Chat.svelte";
    import InfoIcon from "@lucide/svelte/icons/user";
    import HistoryIcon from "@lucide/svelte/icons/folder-clock";
    import ChatIcon from "@lucide/svelte/icons/message-square-more";
    import KillfeedIcon from "@lucide/svelte/icons/swords";
    import Tag from "@lucide/svelte/icons/tag";
    import Killfeed from "../game/Killfeed.svelte";
    import Popup from "./Popup.svelte";
    import Game from "$lib/ws/game.svelte";
    import throttle from "throttleit";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import TagSelector from "../history/TagSelector.svelte";

    let player: Player | null = $state.raw(null);

    const onOpen = (openPlayer: Player) => {
        player = openPlayer;
    }

    const teams = ["Unassigned", "Spectator", "Red", "Blue"];
    let tab = $state("info");
    let showHealth = $derived(Game.user?.team === 1 || player!?.team === Game.user?.team);
    
    const sendNoteFn = () => {
        if(!player) return;

        WS.send(Recieves.SetNote, {
            id: player.ID3,
            note: player.note
        });
    }

    const sendNote = throttle(sendNoteFn, 200);

    const saveTags = () => {
        if(!player) return;

        WS.send(Recieves.SetTags, {
            id: player.ID3,
            tags: $state.snapshot(player.tags)
        });
    }
</script>

<Popup type="openPlayerPopup" {onOpen} class="min-h-[450px] flex flex-col *:nth-[2]:flex-grow"
style="max-width: min(700px, 85%);">
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
                {#if showHealth}
                    <div>Health: {player.health}</div>
                {/if}
                <div>Note:</div>
                <textarea class="resize-y p-1 h-[150px] w-full outline not-focus:outline-zinc-600"
                bind:value={player.note} onchange={sendNote}></textarea>
                <TagSelector bind:tagsObj={player.tags} onChange={saveTags}>
                    <div class="-mt-1">Tags:</div>
                    {#if player.user}
                        <button class="flex items-center text-sm rounded-full px-1.5 bg-accent gap-1">
                            <Tag size={12} color={Game.userColor} />
                            <div class="-mt-0.5">You</div>
                        </button>
                    {/if}
                </TagSelector>
            </Tabs.Content>
            <Tabs.Content value="encounters">
                <!-- Required for infinite loading for some reason -->
                {#if tab === "encounters"}
                    <PastEncounters id={player.ID3} />
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
</Popup>