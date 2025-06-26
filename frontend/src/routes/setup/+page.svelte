<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { fly } from "svelte/transition";
    import SelectDirectories from "./SelectDirectories.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import Directories from "$lib/ws/topics/directories.svelte";
    import LaunchOptions from "./LaunchOptions.svelte";
    import Setup from "$lib/ws/pages/setup.svelte";
    import RconInfo from "./RconInfo.svelte";
    import Autoexec from "./Autoexec.svelte";
    import { Recieves } from "$types/messages";
    import { goto } from "$app/navigation";

    let step = $state(0);
    const steps = 4;

    let flyFactor = $state(1);
    const back = () => { flyFactor = -1; step-- }
    const forward = () => {
        if(step < steps - 1) {
            flyFactor = 1;
            step++;
        } else {
            WS.send(Recieves.FinishSetup, undefined);
            goto("/");
        }
    }

    let done = $derived.by(() => {
        if(step === 0) return Directories.valid;
        else if(step === 1) return Setup.launchOptionsValid;
        else if(step === 2) return Setup.password !== "";
        else if(step === 3) return Setup.autoexecValid;
        return false;
    });

    WS.init("setup");
</script>

<title>Setup | TFView</title>

<AlertDialog.Root open>
    <AlertDialog.Content class="!max-w-[700px]">
        <AlertDialog.Header>
            <AlertDialog.Title class="verdana border-b">Initial TFView Setup</AlertDialog.Title>
        </AlertDialog.Header>
        <div class="relative h-[350px] w-full overflow-hidden">
            {#key step}
                <div class="absolute top-0 left-0 w-full h-full"
                in:fly={{ x: 200 * flyFactor, y: 0, duration: 400 }}
                out:fly={{ x: -200 * flyFactor, y: 0, duration: 400 }}>
                    {#if step === 0}
                        <SelectDirectories />
                    {:else if step === 1}
                        <LaunchOptions />
                    {:else if step === 2}
                        <RconInfo />
                    {:else if step === 3}
                        <Autoexec />
                    {/if}
                </div>
            {/key}
        </div>
        <div class="flex items-center gap-3 relative">
            <div class="absolute top-1/2 left-1/2 -translate-1/2">
                {step + 1}/{steps}
            </div>
            <button class="bg-primary p-1 px-3 rounded"
                disabled={step === 0} onclick={back}>
                Back
            </button>
            <div class="grow"></div>
            <button class="text-sm text-gray-300 underline" onclick={forward}>skip</button>
            <button class="bg-primary p-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!done} onclick={forward}>
                {step < steps - 1 ? "Next" : "Finish"}
            </button>
        </div>
    </AlertDialog.Content>
</AlertDialog.Root>