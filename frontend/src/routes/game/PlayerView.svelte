<script lang="ts">
    import type { Player } from "$types/lobby";
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import User from "@lucide/svelte/icons/square-user-round";
    import Skull from "@lucide/svelte/icons/skull";
    import Popups from "$lib/popups";
    import { classIcons, nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";

    let { player }: { player: Player } = $props();
    let color = $derived(player === Game.user ? "var(--color-amber-900)" : "");
    let showHealth = $derived(Game.user?.team === 1 || player.team === Game.user?.team);
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
                <button class="flex-grow text-left whitespace-nowrap overflow-hidden overflow-ellipsis"
                onclick={() => Popups.openPlayerPopup?.(player)} style={`color: ${nameColors[player.team]}`}>{player.name}</button>
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