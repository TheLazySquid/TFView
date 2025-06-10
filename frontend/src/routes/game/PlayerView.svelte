<script lang="ts">
    import type { Player } from "$types/lobby";
    import User from "@lucide/svelte/icons/square-user-round";
    import Skull from "@lucide/svelte/icons/skull";
    import Popups from "$lib/popups";
    import { classIcons } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";

    let { player }: { player: Player } = $props();
    let color = $derived(player === Game.user ? "var(--color-amber-700)" : "");
    let showHealth = $derived(Game.user?.team === 1 || player.team === Game.user?.team);
</script>

<tr style="background-color: {color}">
    <td>
        {#if player.avatarHash}
            <img class="w-8 h-8"
            src="https://avatars.steamstatic.com/{player.avatarHash}_medium.jpg" alt="Avatar" />
        {:else}
            <User size={32} />
        {/if}
    </td>
    <td>
        <button class="flex-grow text-left whitespace-nowrap overflow-hidden overflow-ellipsis"
        onclick={() => Popups.openPlayerPopup?.(player)}>{player.name}</button>
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