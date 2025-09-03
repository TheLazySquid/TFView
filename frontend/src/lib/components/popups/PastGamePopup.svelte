<script lang="ts">
    import type { PlayerEncounter, StoredPastGame } from "$types/data";
    import { Recieves } from "$types/messages";
    import { NinetyRingWithBg } from "svelte-svg-spinners";
    import WS from "$lib/ws/wsclient.svelte";
    import Popup from "./Popup.svelte";
    import { toast } from "svelte-sonner";
    import DeleteGame from "../history/DeleteGame.svelte";
    import { dateFmt } from "$lib/consts";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import type { EncounterSearchParams } from "$types/search";
    import Avatar from "../player/Avatar.svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import { formatDate, formatDuration } from "$lib/utils";

    let rowid: number | null = $state(null);
    let game: StoredPastGame | null = $state.raw(null);
    let popup: Popup;
    
    const encounters = new InfiniteList<PlayerEncounter, EncounterSearchParams>({
        listId: "encounters",
        idKey: "gameId",
        filter: (encounter, params) => (
            (!encounter.playerId || encounter.playerId === params.id) &&
            (!params.gameId || encounter.gameId === params.gameId) &&
            (!params.after || encounter.time > params.after) &&
            (!params.before || encounter.time < params.before) &&
            (!params.map || encounter.map.includes(params.map)) &&
            (!params.name || encounter.name.includes(params.name))
        )
    });

    const onOpen = async (id: number) => {
        encounters.params.gameId = id;
        encounters.updateSearch();
        
        rowid = id;
        game = await WS.sendAndRecieve(Recieves.GetGame, rowid);
        return `Game on ${game?.map} on ${dateFmt.format(game?.start)}`;
    }

    const copyDemoCommand = (demo: string) => {
        const command = `playdemo demos/${demo}`;
        navigator.clipboard.writeText(command)
            .then(() => toast.success("Demo command copied to clipboard!"))
            .catch(() => toast.error("Failed to copy demo command."));
    }
</script>

<Popup type="game" {onOpen} bind:this={popup}>
    {#if !game}
        <NinetyRingWithBg color="white" />
    {:else}
        <div class="flex items-center gap-2">
            Game on {game.map} on {formatDate(game.start)}
            <DeleteGame {game} onSuccess={() => popup.closePopup()} />
        </div>
        <div>Duration: {formatDuration(game.duration)}</div>
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
                    {#each encounters.items as encounter}
                        <tr>
                            <td><Avatar avatarHash={encounter.avatarHash} name={encounter.name} /></td>
                            <td>{encounter.name}</td>
                            <td>{encounter.kills}/{encounter.deaths}</td>
                        </tr>
                    {/each}
                    <InfiniteLoading on:infinite={encounters.infiniteHandler} identifier={rowid}>
                        <svelte:fragment slot="noResults">
                            No players recorded
                        </svelte:fragment>
                        <div slot="noMore"></div>
                    </InfiniteLoading>
                </tbody>
            </table>
        </div>
    {/if}
</Popup>