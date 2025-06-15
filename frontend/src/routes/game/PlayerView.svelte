<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import User from "@lucide/svelte/icons/square-user-round";
    import Skull from "@lucide/svelte/icons/skull";
    import UserPen from "@lucide/svelte/icons/user-pen";
    import Notepad from "@lucide/svelte/icons/notepad-text";
    import Popups from "$lib/popups";
    import { classIcons, nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Check from "@lucide/svelte/icons/check";

    let { index }: { index: number } = $props();
    let player = $derived(Game.players[index]);
    let color = $derived.by(() => {
        if(player.ID3 === Game.user?.ID3) return Game.userColor;
        for(let tag of Game.tags) {
            if(player.tags[tag.id]) return tag.color;
        }
        return "";
    });
    let showHealth = $derived(Game.user?.team === 1 || player.team === Game.user?.team);

    const setNickname = (player: Player) => {
        Popups.openInputPopup?.({
            title: `Enter nickname for ${player.name}`,
            callback: (nickname) => {
                player.nickname = nickname;
                WS.send(Recieves.SetNickname, {
                    id: player.ID3,
                    nickname
                });
            },
            defaultValue: player.nickname || player.name
        });
    }

    const removeNickname = (player: Player) => {
        player.nickname = null;
        WS.send(Recieves.SetNickname, {
            id: player.ID3,
            nickname: null
        });
    }

    const editNote = (player: Player) => {
        Popups.openInputPopup?.({
            title: `Edit note for ${player.name}`,
            callback: (note) => {
                player.note = note;
                WS.send(Recieves.SetNote, {
                    id: player.ID3,
                    note
                });
            },
            defaultValue: player.note,
            textarea: true
        });
    }

    const toggleTag = (id: string) => {
        player.tags[id] = !player.tags[id];
        
        WS.send(Recieves.SetTags, {
            id: player.ID3,
            tags: $state.snapshot(player.tags)
        });
    }
</script>

{#snippet link(text: string, url: string)}
    <ContextMenu.Item class="p-0">
        <a class="h-full w-full px-2 py-1" href={url} target="_blank">
            {text}
        </a>
    </ContextMenu.Item>
{/snippet}

<tr style="background-color: {color}">
    <td>
        {#if player.avatarHash}
            <button onclick={() => Popups.openProfilePicturePopup?.(player.avatarHash!, player.name)}
            class="contents">
                <img src="https://avatars.steamstatic.com/{player.avatarHash}_medium.jpg"
                class="w-8 h-8" alt="Avatar" />
            </button>
        {:else}
            <User size={32} />
        {/if}
    </td>
    <td>
        <ContextMenu.Root>
            <ContextMenu.Trigger>
                <div class="flex items-center">
                    <button class="flex-grow text-left whitespace-nowrap overflow-hidden overflow-ellipsis"
                    onclick={() => Popups.openPlayerPopup?.(player)} style={`color: ${nameColors[player.team]}`}
                    class:italic={player.nickname}>
                        {player.nickname ? player.nickname : player.name}
                    </button>
                    {#if player.nickname}
                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger><UserPen /></Tooltip.Trigger>
                                <Tooltip.Content class="text-white">Nickname applied, real name is {player.name}</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    {/if}
                    {#if player.note}
                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger class="cursor-pointer" onclick={() => editNote(player)}><Notepad /></Tooltip.Trigger>
                                <Tooltip.Content class="text-white">Player has note saved</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    {/if}
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Sub>
                    <ContextMenu.SubTrigger class="p-0">
                        <a class="h-full w-full px-2 py-1.5" href={`https://steamcommunity.com/profiles/${player.ID64}`} target="_blank">
                            Open Profile
                        </a>
                    </ContextMenu.SubTrigger>
                    <ContextMenu.SubContent>
                        <!-- Expanded from the list I contributed to MegaAntiCheat -->
                        {@render link("Steam Community", `https://steamcommunity.com/profiles/${player.ID64}`)}
                        {@render link("Steamid.io", `https://steamid.io/lookup/${player.ID64}`)}
                        {@render link("Backpack.tf", `https://backpack.tf/profiles/${player.ID64}`)}
                        {@render link("RGL", `https://rgl.gg/Public/PlayerProfile?p=${player.ID64}`)}
                        {@render link("ETF2L", `https://etf2l.org/search/${player.ID64}`)}
                        {@render link("Logs.tf", `https://logs.tf/profile/${player.ID64}`)}
                        {@render link("More.tf", `https://more.tf/profile/${player.ID64}`)}
                        {@render link("Demos.tf", `https://demos.tf/profiles/${player.ID64}`)}
                        {@render link("Trends.tf", `https://trends.tf/player/${player.ID64}`)}
                        {@render link("UGC", `https://www.ugcleague.com/players_page.cfm?player_id=${player.ID64}`)}
                        {@render link("Ozfortress", `https://ozfortress.com/users/steam_id/${player.ID64}`)}
                    </ContextMenu.SubContent>
                </ContextMenu.Sub>
                <ContextMenu.Item onclick={() => setNickname(player)}>
                    Set Nickname
                </ContextMenu.Item>
                {#if player.nickname}
                    <ContextMenu.Item onclick={() => removeNickname(player)}>
                        Remove Nickname
                    </ContextMenu.Item>
                {/if}
                <ContextMenu.Item onclick={() => editNote(player)}>
                    Edit Note
                </ContextMenu.Item>
                <ContextMenu.Sub>
                    <ContextMenu.SubTrigger>
                        Tags
                    </ContextMenu.SubTrigger>
                    <ContextMenu.SubContent>
                        {#each Game.tags as tag}
                            <!-- I know there's a built in checkbox but it's causing problems -->
                            <ContextMenu.Item onclick={() => toggleTag(tag.id)} closeOnSelect={false}>
                                <div class="w-5">
                                    {#if player.tags[tag.id]}
                                        <Check />
                                    {/if}
                                </div>
                                {tag.name}
                            </ContextMenu.Item>
                        {/each}
                    </ContextMenu.SubContent>
                </ContextMenu.Sub>
            </ContextMenu.Content>
        </ContextMenu.Root>
    </td>
    <td>
        {#if typeof player.class === "number"}
            <img src="/classIcons/{classIcons[player.class]}" 
                class="w-6 h-6" alt="Class Icon" />
        {/if}
    </td>
    <td class="w-8 text-center whitespace-nowrap">
        {player.kills}-{player.deaths}
    </td>
    <td class="w-8">
        <div class="flex items-center justify-center">
            {#if player.alive}
                {#if showHealth}
                    {player.health}
                {/if}
            {:else}
                <Skull />
            {/if}
        </div>
    </td>
    <td class="w-8 text-center">{player.ping}</td>
</tr>