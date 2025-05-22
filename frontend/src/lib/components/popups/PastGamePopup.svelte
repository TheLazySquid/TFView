<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { PastGame } from "$types/data";
    import { Recieves } from "$types/messages";
    import { NinetyRingWithBg } from "svelte-svg-spinners";
    import Popups from "$lib/popups";
    import type WSClient from "$lib/ws/wsclient";

    let { ws }: { ws: WSClient<any> } = $props();
    let rowid: number | null = $state(null);
    let game: PastGame | null = $state.raw(null);
    let modalOpen = $state(false);
    let zIndex = $state(50);
    
    Popups.openGamePopup = (id: number) => {
        console.log(id);
        if(rowid !== id) game = null;
        rowid = id;
        modalOpen = true;
        zIndex = Popups.zIndex++;
    }

    $effect(() => {
        if(rowid === null) return;
        ws.sendAndRecieve(Recieves.GetGame, rowid).then((gotGame) => {
            game = gotGame;
        });
    });
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content style="z-index: {zIndex}">
        {#if !game}
            <NinetyRingWithBg color="white" />
        {:else}
            <div>Map: {game.map}</div>
            <div>Start time: <Time date={game.start} /></div>
            <div>Duration: <Time date={game.duration} duration={true} /></div>
            <h2>Players:</h2>
            <div class="overflow-y-auto max-h-[400px] flex flex-col items-start">
                {#each game.players as player}
                    <button class="underline"
                    onclick={() => Popups.openPastPlayerPopup?.(player.id, player.name)}>
                        {player.name}
                    </button>
                {/each}
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>