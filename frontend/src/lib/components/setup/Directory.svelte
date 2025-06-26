<script lang="ts">
    import WS from "$lib/ws/wsclient.svelte";
    import type { GameDir, GameDirInfo } from "$types/data";
    import { Recieves } from "$types/messages";
    import FolderCheck from "@lucide/svelte/icons/folder-check";
    import FolderX from "@lucide/svelte/icons/folder-x";

    let { dir, type }: { dir: GameDirInfo, type: GameDir } = $props();

    const editDirectory = () => {
        WS.send(Recieves.UpdateDirectory, type);
    }
</script>

<button class="{ dir.valid ? "border-green-500" : "border-red-500"}
    border rounded p-3 flex items-center w-full gap-3 mb-2"
    onclick={editDirectory}>
    {#if dir.valid}
        <FolderCheck size={24} />
    {:else}
        <div title="Directory missing or incorrect">
            <FolderX size={24} />
        </div>
    {/if}
    <div class="text-sm">{ dir.path }</div>
</button>