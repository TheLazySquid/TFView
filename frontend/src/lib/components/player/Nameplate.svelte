<script lang="ts">
    import type { HTMLButtonAttributes } from "svelte/elements";
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import type { PastPlayer } from "$types/data";
    import type { KickReason, Player } from "$types/lobby";
    import UserPen from "@lucide/svelte/icons/user-pen";
    import Notepad from "@lucide/svelte/icons/notepad-text";
    import Check from "@lucide/svelte/icons/check";
    import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
    import Images from "@lucide/svelte/icons/images";
    import Popups from "$lib/popups";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import { id3ToId64 } from "$shared/steamid";
    import Tags from "$lib/ws/topics/tags.svelte";
    import { toast } from "svelte-sonner";
    import Avatar from "./Avatar.svelte";
    import PlayerIds from "$lib/ws/topics/playerIds.svelte";

    interface PastProps { player: PastPlayer; current: false }
    interface CurrentProps { player: Player; current: true }
    type Props = (PastProps | CurrentProps) & HTMLButtonAttributes;

    let { player = $bindable(), current, ...restProps }: Props = $props();

    let name = $derived(current ? (player as Player).name : (player as PastPlayer).lastName);
    let id = $derived(current ? (player as Player).ID3 : (player as PastPlayer).id);
    let id64 = $derived(id3ToId64(id));

    const setNickname = () => {
        Popups.open("input", {
            title: `Enter nickname for ${name}`,
            callback: (nickname) => {
                player.nickname = nickname;
                WS.send(Recieves.SetNickname, {
                    id,
                    nickname
                });
            },
            defaultValue: player.nickname || name
        });
    }

    const removeNickname = () => {
        player.nickname = null;
        WS.send(Recieves.SetNickname, { id, nickname: null });
    }

    const editNote = () => {
        Popups.open("input", {
            title: `Edit note for ${name}`,
            callback: (note) => {
                player.note = note;
                WS.send(Recieves.SetNote, { id, note });
            },
            defaultValue: player.note,
            textarea: true
        });
    }

    const toggleTag = (tagId: string) => {
        player.tags[tagId] = !player.tags[tagId];
        
        WS.send(Recieves.SetTags, { id, tags: $state.snapshot(player.tags) });
    }

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success(`"${text}" copied to clipboard!`))
            .catch(() => toast.error("Failed to copy to clipboard."));
    }

    const kick = (userId: string, reason: KickReason) => {
        WS.send(Recieves.KickPlayer, { userId, reason });
    }
</script>

{#snippet link(text: string, url: string)}
    <ContextMenu.Item class="p-0">
        <a class="h-full w-full px-2 py-1" href={url} target="_blank">
            {text}
        </a>
    </ContextMenu.Item>
{/snippet}

{#snippet copyable(text: string, label: string)}
    <ContextMenu.Item onclick={() => copy(text)}>
        {label}
    </ContextMenu.Item>
{/snippet}

{#snippet kickButton(text: string, reason: KickReason)}
    <ContextMenu.Item onclick={() => kick((player as Player).userId, reason)}>
        {text}
    </ContextMenu.Item>
{/snippet}

<ContextMenu.Root>
    <ContextMenu.Trigger>
        <div class="flex items-center pr-2 gap-1">
            <button class="grow text-left whitespace-nowrap overflow-hidden overflow-ellipsis"
            class:italic={player.nickname} class:text-online={!current && PlayerIds.ids.has(id)} {...restProps}>
                {player.nickname ? player.nickname : name}
            </button>
            {#if player.nickname}
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger><UserPen /></Tooltip.Trigger>
                        <Tooltip.Content>Nickname applied, real name is {name}</Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            {/if}
            {#if player.note}
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger class="cursor-pointer" onclick={editNote}><Notepad /></Tooltip.Trigger>
                        <Tooltip.Content>
                            <div class="max-w-[600px] whitespace-pre-line">{player.note}</div>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            {/if}
            {#if player.avatars && player.avatars.length > 1}
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger class="cursor-pointer">
                            <Images />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <div class="w-full text-center">Past profile pictures</div>
                            <div class="flex items-center justify-center gap-1">
                                {#each player.avatars as avatarHash}
                                    {#if avatarHash !== player.avatarHash}
                                        <Avatar {avatarHash} {name} />
                                    {/if}
                                {/each}
                            </div>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            {/if}
            {#if player.names && player.names.length > 1}
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger class="cursor-pointer">
                            <TextCursorInput />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            Past {player.names.length === 2 ? "name" : "names"}: {player.names.filter(n => n !== name).join(", ")}
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            {/if}
        </div>
    </ContextMenu.Trigger>
    <ContextMenu.Content class="z-[100]">
        <ContextMenu.Sub>
            <ContextMenu.SubTrigger class="p-0">
                <a class="h-full w-full px-2 py-1.5" href={`https://steamcommunity.com/profiles/${id64}`} target="_blank">
                    Open Profile
                </a>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
                <!-- Expanded from the list I contributed to MegaAntiCheat -->
                {@render link("Steam Community", `https://steamcommunity.com/profiles/${id64}`)}
                {@render link("Steamid.io", `https://steamid.io/lookup/${id64}`)}
                {@render link("Backpack.tf", `https://backpack.tf/profiles/${id64}`)}
                {@render link("Steamhistory.net", `https://steamhistory.net/id/${id64}`)}
                {@render link("RGL", `https://rgl.gg/Public/PlayerProfile?p=${id64}`)}
                {@render link("ETF2L", `https://etf2l.org/search/${id64}`)}
                {@render link("Logs.tf", `https://logs.tf/profile/${id64}`)}
                {@render link("More.tf", `https://more.tf/profile/${id64}`)}
                {@render link("Demos.tf", `https://demos.tf/profiles/${id64}`)}
                {@render link("Trends.tf", `https://trends.tf/player/${id64}`)}
                {@render link("UGC", `https://www.ugcleague.com/players_page.cfm?player_id=${id64}`)}
                {@render link("Ozfortress", `https://ozfortress.com/users/steam_id/${id64}`)}
            </ContextMenu.SubContent>
        </ContextMenu.Sub>
        <ContextMenu.Item onclick={setNickname}>
            Set Nickname
        </ContextMenu.Item>
        {#if player.nickname}
            <ContextMenu.Item onclick={removeNickname}>
                Remove Nickname
            </ContextMenu.Item>
        {/if}
        <ContextMenu.Item onclick={editNote}>
            Edit Note
        </ContextMenu.Item>
        <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
                Tags
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
                {#each Tags.tags as tag}
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
        <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
                Copy
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
                {@render copyable(name, "Name")}
                {@render copyable(id64, "ID64")}
                {@render copyable(id, "ID3 (Short)")}
                {@render copyable(`[U:1:${id}]`, "ID3 (Full)")}
                {#if current}
                    {@render copyable((player as Player).userId, "Game UserID")}
                {/if}
            </ContextMenu.SubContent>
        </ContextMenu.Sub>
        {#if current}
            <ContextMenu.Sub>
                <ContextMenu.SubTrigger>
                    Call Votekick
                </ContextMenu.SubTrigger>
                <ContextMenu.SubContent>
                    {@render kickButton("Cheating", "cheating")}
                    {@render kickButton("Idle", "idle")}
                    {@render kickButton("Scamming", "scamming")}
                    {@render kickButton("Other", "other")}
                </ContextMenu.SubContent>
            </ContextMenu.Sub>
        {/if}
    </ContextMenu.Content>
</ContextMenu.Root>