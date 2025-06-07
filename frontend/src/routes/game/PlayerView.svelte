<script lang="ts">
    import type { Player } from "$types/lobby";
    import User from "@lucide/svelte/icons/square-user-round";
    import Skull from "@lucide/svelte/icons/skull";
    import Popups from "$lib/popups";
    import { classIcons } from "$lib/consts";

    let { player }: { player: Player } = $props();

</script>

{#if player.avatarHash}
    <img class="w-8 h-8"
    src="https://avatars.steamstatic.com/{player.avatarHash}_medium.jpg" alt="Avatar" />
{:else}
    <User size={32} />
{/if}
<button class="flex-grow text-left"
onclick={() => Popups.openPlayerPopup?.(player)}>{player.name}</button>
<div>
    {#if player.class}
        <img src="/classIcons/{classIcons[player.class]}" 
            class="w-6 h-6" alt="Class Icon" />
    {/if}
</div>
<div class="w-8 text-center">
    {player.kills}-{player.deaths}
</div>
<div class="w-8 flex items-center justify-center">
    {#if player.alive}
        {player.health}
    {:else}
        <Skull />
    {/if}
</div>
<div class="w-8 text-center">{player.ping}</div>