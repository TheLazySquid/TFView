<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import History from "$lib/ws/history.svelte";
    import type { PastGame } from "$types/data";
    import { HistoryRecieves } from "$types/messages";
    import { NinetyRingWithBg } from "svelte-svg-spinners";

    let rowid: number | null = $state(null);
    let game: PastGame | null = $state.raw(null);
    let modalOpen = $state(false);
    
    export function open(id: number) {
        if(rowid !== id) game = null;
        rowid = id;
        modalOpen = true;
    }

    $effect(() => {
        if(rowid === null) return;
        History.sendAndRecieve(HistoryRecieves.GetGame, rowid).then((gotGame) => {
            game = gotGame;
        });
    })
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content>
        {#if !game}
            <NinetyRingWithBg color="white" />
        {:else}
            <div>Map: {game.map}</div>
            <div>Start time: <Time date={game.start} /></div>
            <div>Duration: <Time date={game.duration} duration={true} /></div>
            <h2>Players:</h2>
            <div class="overflow-y-auto max-h-[400px]">
                {#each game.players as player}
                    <div>{player.name}</div>
                {/each}
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>