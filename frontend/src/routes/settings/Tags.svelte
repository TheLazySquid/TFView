<script lang="ts">
    import type { Tag } from "$types/data";
    import Settings from "$lib/ws/pages/settings.svelte";
    import { flip } from "svelte/animate";
    import { dndzone, type DndEvent } from "svelte-dnd-action";
    import { toast } from "svelte-sonner";
    import TagConfig from "./TagConfig.svelte";
    import CirclePlus from "@lucide/svelte/icons/circle-plus";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import throttle from "throttleit";
    import ColorPicker from "svelte-awesome-color-picker";
    import { watch } from "runed";
    
    let items: Tag[] = $state([]);
    $effect(() => {
        if(!Settings.settings.tags) return;
        items = Settings.settings.tags;
    });

    let dragDisabled = $state(true);
    function handleDndConsider(e: CustomEvent<DndEvent<Tag>>) {
        items = e.detail.items;
    }

    function handleDndFinalize(e: CustomEvent<DndEvent<Tag>>) {
        items = e.detail.items;
        dragDisabled = true;
        onupdate();
    }

    const flipDurationMs = 200;

    const deleteTag = (tag: Tag) => {
        let index = items.indexOf(tag);
        if(index === -1) return;

        let item = items.splice(index, 1);
        onupdate();

        toast(`Deleted tag "${tag.name}"`, {
            action: {
                label: "Undo",
                onClick: () => {
                    items.splice(index, 0, ...item);
                    onupdate();
                }
            }
        });
    }

    const createTag = () => {
        let color = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
        items.push({ id: crypto.randomUUID(), name: "New Tag", color });
        onupdate();
    }

    const sendState = () => {
        WS.send(Recieves.UpdateSetting, { key: "tags", value: $state.snapshot(items) });
    }

    const sendUserColor = () => {
        WS.send(Recieves.UpdateSetting, { key: "userColor", value: Settings.settings.userColor });
    }

    const onupdate = throttle(sendState, 250);
    const onUserColorUpdate = throttle(sendUserColor, 250);

    watch(() => Settings.settings.userColor, onUserColorUpdate, { lazy: true });
</script>

<h2 class="text-xl verdana col-span-2 pt-4">User Tags</h2>
{#if Settings.settings.userColor}
    <div class="flex items-center gap-2">
        <div class="picker">
            <ColorPicker bind:hex={Settings.settings.userColor} label="" isAlpha={false} />
        </div>
        <div class="font-semibold">You</div>
    </div>
{/if}
<div class="flex flex-col" onconsider={handleDndConsider} onfinalize={handleDndFinalize}
use:dndzone={{ items, flipDurationMs, dragDisabled, dropTargetStyle: {} }}>
    {#each items as tag, i (tag.id)}
        <div class="flex items-center gap-2"
        animate:flip={{ duration: flipDurationMs }}>
            <TagConfig bind:tag={items[i]} bind:dragDisabled={dragDisabled}
                ondelete={deleteTag} {onupdate} />
        </div>
    {/each}
</div>
<button class="m-1" onclick={createTag}>
    <CirclePlus size={25} />
</button>

<style>
    .picker {
        --cp-bg-color: #333;
		--cp-border-color: white;
		--cp-text-color: white;
		--cp-input-color: #555;
		--cp-button-hover-color: #777;
    }
</style>