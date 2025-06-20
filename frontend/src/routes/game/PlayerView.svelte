<script lang="ts">
    import Skull from "@lucide/svelte/icons/skull";
    import { classIcons, nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import Avatar from "$lib/components/player/Avatar.svelte";
    import GlobalState from "$lib/ws/globalState.svelte";
    import Nameplate from "$lib/components/player/Nameplate.svelte";
    import Popups from "$lib/popups";

    let { index }: { index: number } = $props();
    let player = $derived(Game.players[index]);
    let color = $derived.by(() => {
        if(player.ID3 === Game.user?.ID3) return Game.userColor;
        for(let tag of GlobalState.tags) {
            if(player.tags[tag.id]) return tag.color;
        }
        return "";
    });
    let showHealth = $derived(Game.user?.team === 1 || player.team === Game.user?.team);
</script>

<tr style="background-color: {color}">
    <td>
        <Avatar avatarHash={player.avatarHash} name={player.name} />
    </td>
    <td>
        <Nameplate current={true} bind:player style="color: {nameColors[player.team]}"
            onclick={() => Popups.openPlayerPopup?.(player)} />
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