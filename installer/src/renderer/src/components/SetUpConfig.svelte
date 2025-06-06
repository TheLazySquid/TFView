<script lang="ts">
    import CircleCheck from "@lucide/svelte/icons/circle-check";
    import AutomaticManual from "./AutomaticManual.svelte";
    import { toast } from "svelte-sonner";

    let { done = $bindable() }: { done: boolean } = $props();
    let mastercomfig = $state(false);
    let password = $state("");

    const check = (alert = false) => {
        window.electron.ipcRenderer.invoke("checkCfg").then((valid: boolean) => {
            done = valid;
            
            if(!alert) return;
            if(valid) toast.success("Your autoexec looks good!");
            else toast.error("Your autoexec appears to be incorrect.");
        });
    }
    check();

    window.electron.ipcRenderer.invoke("getRconInfo").then((info: { password: string, mastercomfig: boolean, valid: boolean }) => {
        if(!info) return;
        password = info.password;
        mastercomfig = info.mastercomfig;
        done = info.valid;
    });

    const autoApply = () => {
        window.electron.ipcRenderer.send("applyCfgChanges");

        toast.success("Applied changes to config");
    }
</script>

<div class="flex items-center gap-2 mb-2">
    <h1 class="text-2xl font-bold">Add RCON commands to your autoexec</h1>
    {#if done}
        <CircleCheck color="green" />
    {/if}
</div>

<p>The following commands need to be added to your autoexec for TFView to work:</p>
<pre>ip 0.0.0.0</pre>
<pre>rcon_password {password}</pre>
<pre>net_start</pre>
<p>Your TF2 will also need to be restarted for the changes to apply.</p>

<AutomaticManual>
    {#snippet automatic()}
        <div class="py-2">
            <button class="bg-amber-700 p-1 px-3 rounded" onclick={autoApply}>Apply</button>
        </div>
    {/snippet}
    {#snippet manual()}
        <p>1. Open your autoexec.cfg file at [Your TF2 Install]/tf/cfg/{mastercomfig ? "overrides/" : ""}autoexec.cfg</p>
        <p>2. Paste the lines from above into it</p>
        <p>3. Press the button below to validate your changes</p>
        <button class="bg-amber-700 p-1 px-3 rounded mt-2" onclick={() => check(true)}>
            Validate
        </button>
    {/snippet}
</AutomaticManual>