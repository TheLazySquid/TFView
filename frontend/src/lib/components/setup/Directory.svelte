<script lang="ts">
    import Popups from "$lib/popups";
    import WS from "$lib/ws/wsclient.svelte";
    import type { GameDir, GameDirInfo } from "$types/data";
    import { Recieves } from "$types/messages";
    import FolderCheck from "@lucide/svelte/icons/folder-check";
    import FolderX from "@lucide/svelte/icons/folder-x";
    import Pencil from "@lucide/svelte/icons/pencil";

    let { dir, type }: { dir: GameDirInfo, type: GameDir } = $props();

    const editDirectory = () => {
        WS.send(Recieves.OpenDirectoryPicker, type);
    }

    const openInput = (e: MouseEvent) => {
        e.stopPropagation();

        Popups.open("input", {
            title: `Select ${type} directory`,
            defaultValue: dir.path,
            callback: (path) => {
                WS.send(Recieves.ChangeDirectory, { type, path });
            }
        });
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="{ dir.valid ? "border-green-500" : "border-red-500"}
    border rounded p-3 flex items-center w-full gap-3 mb-2 cursor-pointer"
    onclick={editDirectory}>
    {#if dir.valid}
        <FolderCheck size={24} />
    {:else}
        <div title="Directory missing or incorrect">
            <FolderX size={24} />
        </div>
    {/if}
    <div class="text-sm grow">{ dir.path }</div>
    <button onclick={openInput}>
        <Pencil size={18} />
    </button>
</div>