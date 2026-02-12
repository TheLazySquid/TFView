<script lang="ts">
    import type { PopupArguments } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import type { SourceBanInfo } from "$types/apis";
    import { formatDate } from "$lib/utils";

    let name = $state.raw("");
    let sourceBans: SourceBanInfo[] | null | undefined = $state.raw(undefined);

    const onOpen = (opts: PopupArguments["sourceBans"]) => {
        name = opts.name;
        sourceBans = undefined;

        WS.sendAndRecieve(Recieves.GetSourcebans, opts.id3)
            .then(f => sourceBans = f);

        return opts.name;
    }
</script>

{#snippet BanInfo(ban: SourceBanInfo)}
    <div>
        <div class="flex">
            <span class="font-bold">{ban.Server}</span>
            <div class="grow"></div>
            {formatDate(ban.BanTimestamp * 1000)}
            {#if ban.UnbanTimestamp}
                - {formatDate(ban.UnbanTimestamp * 1000)}
            {/if}
        </div>
        <div>
            <p>Status: {ban.CurrentState}</p>
            <p>Reason: {ban.BanReason}</p>
            {#if ban.UnbanReason}
                <p>Unban Reason: {ban.UnbanReason}</p>
            {/if}
        </div>
    </div>
{/snippet}

<Popup type="sourceBans" {onOpen} class="min-w-[800px]">
    <Dialog.Header>
        <Dialog.Title>{name}'s SourceBans</Dialog.Title>
    </Dialog.Header>
    <div class="text-xs italic">This only includes players who you have encountered at least once</div>
    {#if sourceBans?.length}
        <div class="max-h-[800px] overflow-y-auto">
            {#each sourceBans as ban, i}
                {@render BanInfo(ban)}
                {#if i < sourceBans.length - 1}
                    <hr class="my-2" />
                {/if}
            {/each}
        </div>
    {:else if sourceBans}
        <div>This user has no recorded SourceBans.</div>
    {:else if sourceBans === null}
        <div>Failed to load SourceBans.</div>
    {:else}
        <div>Loading...</div>
    {/if}
</Popup>