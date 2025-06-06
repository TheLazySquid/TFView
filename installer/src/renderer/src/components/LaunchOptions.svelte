<script lang="ts">
    import CircleCheck from "@lucide/svelte/icons/circle-check";
    import AutomaticManual from "./AutomaticManual.svelte";
    import { toast } from "svelte-sonner";

    let { done = $bindable() }: { done: boolean } = $props();

    const check = (alert = false) => {
        window.electron.ipcRenderer.invoke("checkLaunchOptions").then((valid) => {
            done = valid;

            if(!alert) return;
            if(valid) toast.success("Your autoexec looks good!");
            else toast.error("Your autoexec appears to be incorrect.");
        });
    }
    check();

    const autoApply = () => {
        window.electron.ipcRenderer.invoke("applyLaunchOptions").then((success: boolean) => {
            if(success) done = true;
        });
    }
</script>

<div class="flex items-center gap-2 mb-2">
    <h1 class="text-2xl font-bold">Add needed launch options</h1>
    {#if done}
        <CircleCheck color="green" />
    {/if}
</div>
<p>TF2 needs to have following launch options for TFView to work:</p>
<pre>-condebug -conclearlog -usercon -g15</pre>
<AutomaticManual>
    {#snippet automatic()}
        <div class="py-2">
            <button class="bg-amber-700 p-1 px-3 rounded" onclick={autoApply}>Apply (will kill steam)</button>
        </div>
    {/snippet}
    {#snippet manual()}
        <p>1. Right click on TF2 in your steam library</p>
        <p>2. Select "Properties"</p>
        <p>3. Paste the options from above into "Launch Options"</p>
        <p>4. Press the button below to validate your changes</p>
        <button class="bg-amber-700 p-1 px-3 rounded mt-2" onclick={() => check(true)}>
            Validate
        </button>
    {/snippet}
</AutomaticManual>