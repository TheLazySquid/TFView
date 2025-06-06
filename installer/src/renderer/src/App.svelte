<script lang="ts">
    import { fly } from "svelte/transition";
    import SelectDir from "./components/SelectDir.svelte";
    import LaunchOptions from "./components/LaunchOptions.svelte";
    import { Toaster, toast } from "svelte-sonner";
    import SetUpConfig from "./components/SetUpConfig.svelte";
    import RconInfo from "./components/RconInfo.svelte";

    let flyFactor = $state(1);
    let step = $state(0);
    const steps = 4;
    
    let done = $state(new Array(steps).fill(false));
    const back = () => { flyFactor = -1; step-- }
    const forward = () => { flyFactor = 1; step++ }

    window.electron.ipcRenderer.on("error", (_, message: string) => {
        toast.error(message);
    });
</script>

<Toaster richColors position="top-right" />
<div class="h-screen w-screen bg-zinc-900 flex flex-col p-4 text-white overflow-hidden">
    <div class="grow relative">
        {#key step}
            <div class="absolute top-0 left-0"
            in:fly={{ x: 200 * flyFactor, y: 0, duration: 400 }}
            out:fly={{ x: -200 * flyFactor, y: 0, duration: 400 }}>
                {#if step === 0}
                    <SelectDir bind:done={done[0]} />
                {:else if step === 1}
                    <LaunchOptions bind:done={done[1]} />
                {:else if step === 2}
                    <RconInfo bind:done={done[2]} />
                {:else if step === 3}
                    <SetUpConfig bind:done={done[3]} />
                {/if}
            </div>
        {/key}
    </div>
    <div class="flex items-center gap-3 relative">
        <div class="absolute top-1/2 left-1/2 -translate-1/2">
            {step + 1}/{steps}
        </div>
        <button class="bg-amber-700 p-1 px-3 rounded"
            disabled={step === 0} onclick={back}>
            Back
        </button>
        <div class="grow"></div>
        <button class="text-sm text-gray-300 underline">skip</button>
        <button class="bg-amber-700 p-1 px-3 rounded"
            disabled={!done[step]} onclick={forward}>
            Next
        </button>
    </div>
</div>