<script lang="ts">
    import Avatar from "$lib/components/player/Avatar.svelte";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import ProfilePicturePopup from "$lib/components/popups/ProfilePicturePopup.svelte";
    import Time from "$lib/components/Time.svelte";
    import Popups from "$lib/popups";
    import PlayerHistory from "$lib/ws/playerHistory.svelte";
    import type { StoredPlayer } from "$types/data";
    import InfiniteLoading from "svelte-infinite-loading";

    PlayerHistory.init();

    const getColor = (player: StoredPlayer) => {
        if(!player.tags) return "";
        for(let tag of PlayerHistory.tags) {
            if(player.tags.includes(tag.id)) {
                return tag.color;
            }
        }
        return "";
    }
</script>

<ProfilePicturePopup />
<PastPlayerPopup />
<PastGamePopup />

{#snippet playersEnd()}
    No more players recorded
{/snippet}

<div class="w-full h-full flex justify-center">
    <div class="overflow-y-auto" style="width: min(1000px, 90%)">
        {#if PlayerHistory.players.total !== undefined}
            <div>Total players recorded: {PlayerHistory.players.total}</div>
        {/if}
        <table class="w-full">
            <thead class="sticky top-0 bg-background">
                <tr class="*:text-left">
                    <th class="min-w-10 w-10"></th>
                    <th>Name</th>
                    <th>Last Seen</th>
                </tr>
            </thead>
            <tbody>
                {#each PlayerHistory.players.items as player}
                    <tr class="border-t-2 *:py-1" style="background-color: {getColor(player)}">
                        <td>
                            <Avatar avatarHash={player.avatarHash} name={player.lastName} />
                        </td>
                        <td>
                            <button onclick={() => Popups.openPastPlayerPopup?.(player.id, player.lastName)}
                                class="underline w-full text-left">
                                {player.lastName}
                            </button>
                        </td>
                        <td><Time date={player.lastSeen} /></td>
                    </tr>
                {/each}
                <tr>
                    <th colspan={6} class="border-t-2">
                        <InfiniteLoading on:infinite={PlayerHistory.players.infiniteHandler}>
                            <svelte:fragment slot="noResults">{@render playersEnd()}</svelte:fragment>
                            <svelte:fragment slot="noMore">{@render playersEnd()}</svelte:fragment>
                        </InfiniteLoading>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
</div>