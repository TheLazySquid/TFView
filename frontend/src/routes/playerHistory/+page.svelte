<script lang="ts">
    import type { StoredPlayer } from "$types/data";
    import Avatar from "$lib/components/player/Avatar.svelte";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import ProfilePicturePopup from "$lib/components/popups/ProfilePicturePopup.svelte";
    import Time from "$lib/components/Time.svelte";
    import Popups from "$lib/popups";
    import PlayerHistory from "$lib/ws/playerHistory.svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import GlobalState from "$lib/ws/globalState.svelte";
    import TagSelector from "$lib/components/history/TagSelector.svelte";
    import * as Search from "$lib/components/search";

    PlayerHistory.init();

    const getColor = (player: StoredPlayer) => {
        if(!player.tags) return "";
        for(let tag of GlobalState.tags) {
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
        <Search.SearchBox title="Search Players" singular="player" plural="players" list={PlayerHistory.players}>
            <div class="content-center">Name or ID:</div>
            <Search.TextInput bind:value={PlayerHistory.players.params.name} />

            <div class="content-center">Last seen after:</div>
            <Search.DateInput bind:timestamp={PlayerHistory.players.params.after} />
            
            <div class="content-center">Last seen before:</div>
            <Search.DateInput bind:timestamp={PlayerHistory.players.params.before} />

            <div>Tags:</div>
            <TagSelector bind:tags={PlayerHistory.players.params.tags} />
        </Search.SearchBox>
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
                        <InfiniteLoading on:infinite={PlayerHistory.players.infiniteHandler}
                            identifier={PlayerHistory.players.identifier}>
                            <svelte:fragment slot="noResults">{@render playersEnd()}</svelte:fragment>
                            <svelte:fragment slot="noMore">{@render playersEnd()}</svelte:fragment>
                        </InfiniteLoading>
                    </th>
                </tr>
            </tbody>
        </table>
    </div>
</div>