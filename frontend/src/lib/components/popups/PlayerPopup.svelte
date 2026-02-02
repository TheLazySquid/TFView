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
    import * as Tooltip from "$lib/components/ui/tooltip";
    import PastInfo from "../player/PastInfo.svelte";
    import { formatDate, formatTimeAgo } from "$lib/utils";
    import type { PastPlayer } from "$types/data";
    import Nameplate from "../player/Nameplate.svelte";
    import Settings from "$lib/ws/topics/settings.svelte";
    import UserFriends from "$lib/ws/topics/userFriends.svelte";
    import userFriendsSvelte from "$lib/ws/topics/userFriends.svelte";

    let player: Player | null = $state.raw(null);
    let friends: PastPlayer[] | null = $state.raw(null);

    const onOpen = (openPlayer: Player) => {
        // Fetch the users' friends list
        WS.sendAndRecieve(Recieves.GetFriends, openPlayer.ID3)
            .then(f => friends = f);

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
                                {formatTimeAgo(player.createdTimestamp * 1000)}
                            </Tooltip.Trigger>
                            <Tooltip.Content class="z-[100]">
                                {formatDate(player.createdTimestamp * 1000)}
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                {/if}
                {#if friends?.length}
                    <div>Known Friends:</div>
                    <div class="flex flex-col max-h-[200px] overflow-y-auto">
                        {#each friends as friend}
                            <div class="flex items-center gap-2">
                                <Avatar avatarHash={friend.avatarHash} name={friend.lastName} />
                                <Nameplate current={false} player={friend} grow={true}
                                    onclick={() => Game.openPlayer(friend.id)}/>
                            </div>
                        {/each}
                    </div>
                {/if}
                <div>Note:</div>
                <textarea class="resize-y p-1 h-[150px] w-full outline not-focus:outline-zinc-600"
                bind:value={player.note} onchange={sendNote}></textarea>
                <TagSelector bind:tagsObj={player.tags} onChange={saveTags}
                    you={player.user} friend={UserFriends.ids.has(player.ID3)}>
                    <div class="-mt-1">Tags:</div>
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