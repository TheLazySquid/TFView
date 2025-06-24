<script lang="ts">
    import Time from "$lib/components/Time.svelte";
    import type { StoredPastGame } from "$types/data";
    import { Recieves } from "$types/messages";
    import { NinetyRingWithBg } from "svelte-svg-spinners";
    import Popups from "$lib/popups";
    import WS from "$lib/ws/wsclient.svelte";
    import Popup from "./Popup.svelte";
    import { toast } from "svelte-sonner";
    import DeleteGame from "../history/DeleteGame.svelte";

    let rowid: number | null = $state(null);
    let game: StoredPastGame | null = $state.raw(null);
    let popup: Popup;
    
    const onOpen = async (id: number) => {
        rowid = id;
        game = await WS.sendAndRecieve(Recieves.GetGame, rowid);
    }

    const copyDemoCommand = (demo: string) => {
        const command = `playdemo demos/${demo}`;
        navigator.clipboard.writeText(command)
            .then(() => toast.success("Demo command copied to clipboard!"))
            .catch(() => toast.error("Failed to copy demo command."));
    }
</script>

<Popup type="openGamePopup" {onOpen} group={0} bind:this={popup}>
    {#if !game}
        <NinetyRingWithBg color="white" />
    {:else}
        <div class="flex items-center gap-2">
            Game on {game.map} on <Time timestamp={game.start} type="date" />
            <DeleteGame {game} onSuccess={() => popup.closePopup()} />
        </div>
        <div>Duration: <Time timestamp={game.duration} type="duration" /></div>
        <div>Server: {game.hostname ? `${game.hostname} (${game.ip})` : "Unknown"}</div>
        {#if game?.demos && game.demos.length > 0}
            <div class="flex items-center gap-2 flex-wrap">
                Associated demos:
                {#each game.demos as demo}
                    <button onclick={() => copyDemoCommand(demo)}
                    class="border-b border-gray-300">
                        {demo}
                    </button>
                {/each}
            </div>
        {/if}
        <div class="overflow-y-auto max-h-[400px]">
            <table class="w-full">
                <thead class="sticky top-0 bg-background">
                    <tr class="*:text-left">
                        <th>Player</th>
                        <th>K/D</th>
                    </tr>
                </thead>
                <tbody>
                    {#each game.players as player}
                        <tr>
                            <td>
                                <button onclick={() => Popups.openPastPlayerPopup?.(player.id)} 
                                    class="underline">
                                    {player.name}
                                </button>
                            </td>
                            <td>{player.kills}/{player.deaths}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</Popup>