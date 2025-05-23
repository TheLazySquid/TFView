<script lang="ts">
    import type { Player } from "$types/lobby";
    import Popups from "$lib/popups";
    import User from "@lucide/svelte/icons/square-user-round";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";
    import Skull from "@lucide/svelte/icons/skull";

    let { player }: { player: Player } = $props();
</script>

<button class="bg-accent flex items-center h-10 px-1 gap-1"
onclick={() => Popups.openPlayerPopup?.(player)}>
    {#if player.avatarHash}
        <img class="w-8 h-8"
        src="https://avatars.steamstatic.com/{player.avatarHash}_medium.jpg" alt="Avatar" />
    {:else}
        <User size={32} />
    {/if}
    <div class="flex-grow text-left">{player.name}</div>
    <Ping size={28} />
    <div class="w-8">{player.ping}</div>
    <HeartPulse size={24} />
    <div class="w-8">
        {#if player.alive}
            {player.health}
        {:else}
            <Skull size={28} />
        {/if}
    </div>
</button>