<script lang="ts">
    import FolderCheck from "@lucide/svelte/icons/folder-check";
    import FolderX from "@lucide/svelte/icons/folder-x";

    let { done = $bindable() }: { done: boolean } = $props();
    let steamDir = $state(""), steamValid = $state(false);
    let tfDir = $state(""), tfValid = $state(false);

    const update = (dirInfo: any) => {
        if(!dirInfo) return;
        steamDir = dirInfo.steam; steamValid = dirInfo.steamValid;
        tfDir = dirInfo.tf; tfValid = dirInfo.tfValid;
        done = steamValid && tfValid;
    }

    window.electron.ipcRenderer.invoke("getDirs").then(update);
    const openDirPicker = (type: string) => {
        window.electron.ipcRenderer.invoke("pickDir", type).then(update);
    }
</script>

{#snippet dirPicker(type: string, path: string, valid: boolean)}
    <button class="border-zinc-700 border rounded p-3 flex items-center w-full gap-3 mb-2"
    onclick={() => openDirPicker(type)}>
        {#if valid}
            <FolderCheck size={24} />
        {:else}
            <div title="Directory missing or incorrect">
                <FolderX size={24} />
            </div>
        {/if}
        <div class="text-sm">{ path }</div>
    </button>
{/snippet}

<h1 class="text-2xl font-bold mb-2">Select your Steam and TF directories</h1>
<div>Steam</div>
{@render dirPicker("steam", steamDir, steamValid)}
<div>TF</div>
{@render dirPicker("tf", tfDir, tfValid)}