<script lang="ts">
    import Skull from "@lucide/svelte/icons/skull";
    import { classIcons, nameColors } from "$lib/consts";
    import Game from "$lib/ws/pages/game.svelte";
    import Avatar from "$lib/components/player/Avatar.svelte";
    import Tags from "$lib/ws/topics/tags.svelte";
    import Nameplate from "$lib/components/player/Nameplate.svelte";
    import Popups from "$lib/popups";
    import { columns } from "./state.svelte";

    let { index }: { index: number } = $props();
    let player = $derived(Game.players[index]);
    let color = $derived.by(() => {
        if(player.user) return Game.userColor;
        for(let tag of Tags.tags) {
            if(player.tags[tag.id]) return tag.color;
        }
        return "";
    });
    let showHealth = $derived(Game.userTeam === 1 || player.team === Game.userTeam);
</script>

<tr style="background-color: {color}" class:opacity-50={!player.alive}>
    <td>
        <Avatar avatarHash={player.avatarHash} name={player.name} />
    </td>
    <td>
        <Nameplate current={true} bind:player style="color: {nameColors[player.team]}"
            onclick={() => Popups.openPlayerPopup?.(player)} />
    </td>
    {#if player.team !== 1}
        {#if columns.class}
            <td>
                {#if typeof player.class === "number"}
                    <img src="/classIcons/{classIcons[player.class]}" 
                        class="w-6 h-6" alt="Class Icon" />
                {/if}
            </td>
        {/if}
        {#if columns.killstreak}
            <td class="w-8 text-center">{player.killstreak > 0 ? player.killstreak : ""}</td>
        {/if}
        {#if columns.kd}
            <td class="w-8 text-center whitespace-nowrap">
                {player.kills}-{player.deaths}
            </td>
        {/if}
        {#if columns.health}
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
        {/if}
    {/if}
    {#if columns.ping}
        <td class="w-8 text-center">{player.ping}</td>
    {/if}
    {#if columns.encounters}
        <td class="w-8 text-center">{player.encounters}</td>
    {/if}
</tr>