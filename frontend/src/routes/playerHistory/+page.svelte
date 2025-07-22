<script lang="ts">
    import Avatar from "$lib/components/player/Avatar.svelte";
    import PastGamePopup from "$lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import ProfilePicturePopup from "$lib/components/popups/ProfilePicturePopup.svelte";
    import Time from "$lib/components/Time.svelte";
    import PlayerHistory from "$lib/ws/pages/playerHistory.svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import Tags from "$lib/ws/topics/tags.svelte";
    import TagSelector from "$lib/components/history/TagSelector.svelte";
    import * as Search from "$lib/components/search";
    import Nameplate from "$lib/components/player/Nameplate.svelte";
    import Popups from "$lib/popups";
    import InputPopup from "$lib/components/popups/InputPopup.svelte";
    import ConfirmPopup from "$lib/components/popups/ConfirmPopup.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { List } from "$lib/components/ui/tabs";

    WS.init("playerhistory");

    const getColor = (tags: Record<string, boolean>) => {
        for(let tag of Tags.tags) {
            if(tags[tag.id]) {
                return tag.color;
            }
        }
        return "";
    }
</script>

<ProfilePicturePopup />
<PastPlayerPopup />
<PastGamePopup />
<InputPopup />
<ConfirmPopup />

{#snippet playersEnd()}
    No more players recorded
{/snippet}

<div class="w-full h-full flex justify-center">
    <div class="overflow-y-auto" style="width: min(1000px, 90%)">
        <Search.SearchBox title="Search Players" singular="player" plural="players"
            list={PlayerHistory.players} defaultParams={{ sortBy: "lastSeen" }}>
            <div class="content-center">Name or ID:</div>
            <Search.TextInput bind:value={PlayerHistory.players.params.name} />

            <div class="content-center">Last seen after:</div>
            <Search.DateInput bind:timestamp={PlayerHistory.players.params.after} />
            
            <div class="content-center">Last seen before:</div>
            <Search.DateInput bind:timestamp={PlayerHistory.players.params.before} />

            <div class="content-center">Tags:</div>
            <TagSelector bind:tags={PlayerHistory.players.params.tags}
                onChange={() => PlayerHistory.players.updateSearch()} />

            <div class="content-center">Sort by:</div>
            <Search.Select bind:value={PlayerHistory.players.params.sortBy} options={{
                lastSeen: "Last Seen",
                encounters: "Times Encountered"
            }} />
        </Search.SearchBox>
        <table class="w-full">
            <thead class="sticky top-0 bg-background">
                <tr class="*:text-left">
                    <th class="min-w-10 w-10"></th>
                    <th>Name</th>
                    <th>Last Seen</th>
                    <th>Times Encounterd</th>
                </tr>
            </thead>
            <tbody>
                {#each PlayerHistory.players.items as player, i}
                    <tr class="border-t-2 *:py-1" style="background-color: {getColor(player.tags)}">
                        <td>
                            <Avatar avatarHash={player.avatarHash} name={player.lastName} />
                        </td>
                        <td>
                            <Nameplate current={false} bind:player={PlayerHistory.players.items[i]}
                                onclick={() => Popups.openPastPlayerPopup?.(player.id)} /> 
                        </td>
                        <td><Time timestamp={player.lastSeen} type="date" /></td>
                        <td>{player.encounters}</td>
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