<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import WS from "$lib/ws/wsclient.svelte";
    import type { PastPlayer } from "$types/data";
    import { Recieves } from "$types/messages";
    import PastEncounters from "../history/PastEncounters.svelte";
    import TagSelector from "../history/TagSelector.svelte";
    import Popup from "./Popup.svelte";
    import InfoIcon from "@lucide/svelte/icons/user";
    import HistoryIcon from "@lucide/svelte/icons/folder-clock";
    import throttle from "throttleit";
    import Nameplate from "../player/Nameplate.svelte";
    import Avatar from "../player/Avatar.svelte";

    let player: PastPlayer | null = $state(null);

    const onOpen = async (id: string) => {
        player = await WS.sendAndRecieve(Recieves.GetPlayer, id);
    }

    const sendNoteFn = () => {
        if(!player || player.note === undefined) return;

        WS.send(Recieves.SetNote, {
            id: player.id,
            note: player.note
        });
    }

    const sendNote = throttle(sendNoteFn, 200);

    const saveTags = () => {
        if(!player) return;

        WS.send(Recieves.SetTags, {
            id: player.id,
            tags: $state.snapshot(player.tags)
        });
    }

    let tab = $state("info");
</script>

<Popup type="openPastPlayerPopup" style="max-width: min(90%, 750px)" {onOpen} group={0}>
    {#if player}
        <Dialog.Header class="flex flex-row items-center">
            <Avatar avatarHash={player.avatarHash} name={player.lastName} />
            <div class="grow">
                <Nameplate bind:player current={false} />
            </div>
        </Dialog.Header>
        <Tabs.Root bind:value={tab}>
            <Tabs.List class="w-full">
                <Tabs.Trigger value="info"><InfoIcon /></Tabs.Trigger>
                <Tabs.Trigger value="encounters"><HistoryIcon /></Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="info">
                {#if player.names.length > 1}
                    <div>Past names: {player.names.join(", ")}</div>
                {/if}
                <div>Note:</div>
                <textarea class="resize-y p-1 h-[150px] w-full outline not-focus:outline-zinc-600 mb-3"
                bind:value={player.note} onchange={sendNote}></textarea>
                <TagSelector bind:tagsObj={player.tags} onChange={saveTags}>
                    <div class="-mt-1">Tags:</div>
                </TagSelector>
            </Tabs.Content>
            <Tabs.Content value="encounters">
                {#if tab === "encounters"}
                    <PastEncounters id={player.id} />
                {/if}
            </Tabs.Content>
        </Tabs.Root>
    {/if}
</Popup>