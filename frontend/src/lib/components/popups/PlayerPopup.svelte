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
    import Game from "$lib/ws/pages/game.svelte";
    import throttle from "throttleit";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import TagSelector from "../history/TagSelector.svelte";
    import Avatar from "../player/Avatar.svelte";
    import { nameColors } from "$lib/consts";
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";
    import Skull from "@lucide/svelte/icons/skull";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import Eye from "@lucide/svelte/icons/eye";
    import Time from "../Time.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import PastInfo from "../player/PastInfo.svelte";

    let player: Player | null = $state.raw(null);

    const onOpen = (openPlayer: Player) => {
        player = openPlayer;
        return player.name;
    }

    let tab = $state("info");
    let showHealth = $derived(Game.userTeam === 1 || player!?.team === Game.userTeam);
    
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

<Popup type="player" {onOpen} class="min-h-[450px] flex flex-col *:[[data-tabs-root]]:flex-grow"
style="max-width: min(700px, 85%);">
    {#if player}
        <Dialog.Header class="text-2xl flex flex-row items-center">
            <Avatar avatarHash={player.avatarHash} name={player.name} />
            <div style="color: {nameColors[player.team]};"
                class="-mt-1" class:italic={player.nickname}>
                { player.nickname ? player.nickname : player.name }
            </div>
            {#if player.nickname}
                <div class="-mt-1" style="color: {nameColors[player.team]};">
                    ({ player.name })
                </div>
            {/if}
        </Dialog.Header>
        <Tabs.Root bind:value={tab}>
            <Tabs.List class="w-full">
                <Tabs.Trigger value="info"><InfoIcon /></Tabs.Trigger>
                {#if !player.user}
                    <Tabs.Trigger value="encounters"><HistoryIcon /></Tabs.Trigger>
                {/if}
                <Tabs.Trigger value="chat"><ChatIcon /></Tabs.Trigger>
                <Tabs.Trigger value="kills"><KillfeedIcon /></Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="info">
                <div class="grid gap-x-2" style="grid-template-columns: auto auto 1fr">
                    {#if !player.user}
                        <Eye />
                        <div>Encounters</div>
                        <div>{player.encounters ?? 0}</div>
                    {/if}

                    <HeartPulse />
                    {#if showHealth}
                        <div>Health</div>
                        <div>
                            {#if !player.alive}
                                <Skull />
                            {:else}
                                {player.health}
                            {/if}
                        </div>
                    {:else}
                        <div>Alive?</div>
                        <div>{ player.alive ? "Yes" : "No" }</div>
                    {/if}

                    <img src="/Killstreak_icon.png" alt="Killstreak" width="24" height="24" />
                    <div>Killstreak</div>
                    <div>{player.killstreak}</div>

                    <Ping />
                    <div>Ping</div>
                    <div>{player.ping} ms</div>

                    <PastInfo names={player.names} avatars={player.avatars} 
                        name={player.name} avatarHash={player.avatarHash} />
                </div>
                {#if player.createdTimestamp && player.createdTimestamp > 0}
                    <Tooltip.Provider>
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                Account created
                                <!-- Steam's timestamps are in seconds rather than ms -->
                                <Time type="past" timestamp={player.createdTimestamp * 1000} />
                            </Tooltip.Trigger>
                            <Tooltip.Content class="z-[100]">
                                <Time type="date" timestamp={player.createdTimestamp * 1000} />
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
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
            {#if !player.user}
                <Tabs.Content value="encounters">
                    <!-- Required for infinite loading for some reason -->
                    {#if tab === "encounters"}
                        <PastEncounters id={player.ID3} />
                    {/if}
                </Tabs.Content>
            {/if}
            <Tabs.Content value="chat" class="grid max-h-[400px]">
                {#if tab === "chat"}
                    <Chat id={player.ID3} />
                {/if}
            </Tabs.Content>
            <Tabs.Content value="kills" class="grid max-h-[400px]">
                {#if tab === "kills"}
                    <Killfeed id={player.ID3} class="max-h-[400px]" />
                {/if}
            </Tabs.Content>
        </Tabs.Root>
    {/if}
</Popup>