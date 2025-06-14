<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import type { PastGame } from "$types/data";
    import { Recieves } from "$types/messages";
    import { NinetyRingWithBg } from "svelte-svg-spinners";
    import Popups from "$lib/popups";
    import WS from "$lib/ws/wsclient.svelte";
    import Popup from "./Popup.svelte";

    let rowid: number | null = $state(null);
    let game: PastGame | null = $state.raw(null);
    
    const onOpen = (id: number) => {
        if(rowid !== id) game = null;
        rowid = id;
    }

    $effect(() => {
        if(rowid === null) return;
        WS.sendAndRecieve(Recieves.GetGame, rowid).then((gotGame) => {
            game = gotGame;
        });
    });
</script>

<Popup type="openGamePopup" {onOpen}>
    {#if !game}
        <NinetyRingWithBg color="white" />
    {:else}
        <div>Map: {game.map}</div>
        <div>Start time: <Time date={game.start} /></div>
        <div>Duration: <Time date={game.duration} duration={true} /></div>
        <div>Server: {game.hostname ? `${game.hostname} (${game.ip})` : "Unknown"}</div>
        <h2>Players:</h2>
        <table class="overflow-y-auto max-h-[400px]">
            <thead>
                <tr class="*:text-left">
                    <th>Player</th>
                    <th>K/D</th>
                </tr>
            </thead>
            <tbody class="sticky top-0">
                {#each game.players as player}
                    <tr>
                        <td>
                            <button class="underline"
                            onclick={() => Popups.openPastPlayerPopup?.(player.id, player.name)}>
                                {player.name}
                            </button>
                        </td>
                        <td>{player.kills}/{player.deaths}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</Popup>