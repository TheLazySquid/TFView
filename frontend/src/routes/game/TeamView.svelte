<script lang="ts">
    import { nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import PlayerView from "./PlayerView.svelte";
    import Ping from "@lucide/svelte/icons/chart-no-axes-column-increasing"
    import HeartPulse from "@lucide/svelte/icons/heart-pulse";

    interface Props {
        ids?: number[];
        name: string;
        spectator?: boolean;
        inSplit?: boolean;
    }

    let { ids = [2, 3], name, spectator = false, inSplit = false }: Props = $props();

    // Nasty hack to get around some warnings
    let playerIndexes = $derived(Game.players.map((p, i) => ({ p, i })).filter(({ p }) => ids.includes(p.team)).map(({ i }) => i));
</script>

<div class="w-full h-full flex flex-col items-center">
    <h2 class="w-full text-center text-5xl pb-2" style={inSplit ? `color: ${nameColors[ids[0]]}` : ""}>{name}</h2>
    <table class="overflow-y-auto block" style={ inSplit ? "width: 100%" : "width: min(100%, 900px)" }>
        <thead class="sticky top-0 bg-background">
            <tr class="*:pr-1.5">
                <th class="min-w-10"></th> 
                <th class="w-full"></th>
                {#if !spectator}
                    <th class="min-w-8"></th>
                    <th class="whitespace-nowrap">K/D</th> 
                    <th class="w-9"><div class="flex w-full h-full items-center justify-center"><HeartPulse /></div></th> 
                {/if}
                <th class="w-9"><div class="flex w-full h-full items-center justify-center"><Ping /></div></th> 
            </tr>
        </thead>
        <tbody class="[&>tr>td]:pr-1.5">
            {#each playerIndexes as index}
                <PlayerView {index} />
            {/each}
        </tbody>
    </table>
</div>