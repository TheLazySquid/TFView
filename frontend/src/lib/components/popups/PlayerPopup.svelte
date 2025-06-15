<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import PastEncounters from "../history/PastEncounters.svelte";
    import Chat from "../game/Chat.svelte";
    import InfoIcon from "@lucide/svelte/icons/user";
    import HistoryIcon from "@lucide/svelte/icons/folder-clock";
    import ChatIcon from "@lucide/svelte/icons/message-square-more";
    import KillfeedIcon from "@lucide/svelte/icons/swords";
    import Tag from "@lucide/svelte/icons/tag";
    import CircleX from "@lucide/svelte/icons/circle-x";
    import CirclePlus from "@lucide/svelte/icons/circle-plus";
    import Killfeed from "../game/Killfeed.svelte";
    import Popup from "./Popup.svelte";
    import Game from "$lib/ws/game.svelte";
    import throttle from "throttleit";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";

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

    let hasTags = $derived(Game.tags.filter((t) => player!?.tags[t.id]));
    let missingTags = $derived(Game.tags.filter((t) => !player!?.tags[t.id]));

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
                <div class="flex items-center gap-1 pt-2">
                    <div class="-mt-1">Tags:</div>
                    {#if player.user}
                        <button class="flex items-center text-sm rounded-full px-1.5 bg-accent gap-1">
                            <Tag size={12} />
                            <div class="-mt-0.5">You</div>
                        </button>
                    {/if}
                    {#each hasTags as tag}
                        <button class="flex items-center text-sm rounded-full px-1.5 bg-accent gap-1"
                        onclick={() => { player!.tags[tag.id] = false; saveTags() }}>
                            <Tag size={12} color={tag.color} />
                            <div class="-mt-0.5">{tag.name}</div>
                            <CircleX size={12} />
                        </button>
                    {/each}
                    {#if missingTags.length > 0}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <CirclePlus size={16} />
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                {#each missingTags as tag}
                                    <DropdownMenu.Item onclick={() => { player!.tags[tag.id] = true; saveTags() }}>
                                        <Tag size={16} color={tag.color} />
                                        {tag.name}
                                    </DropdownMenu.Item>
                                {/each}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    {/if}
                </div>
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