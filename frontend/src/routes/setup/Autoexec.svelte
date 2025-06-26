<script lang="ts">
    import AutomaticManual from "$lib/components/setup/AutomaticManual.svelte";
    import Setup from "$lib/ws/pages/setup.svelte";
    import { toast } from "svelte-sonner";
    import Heading from "./Heading.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";

    Setup.checkAutoexec();

    const autoApply = async () => {
        let success = await WS.sendAndRecieve(Recieves.ApplyAutoexec, Setup.mastercomfig);
        if(success) Setup.autoexecValid = true;

        if(success) toast.success("Successfully applied autoexec!");
        else toast.error("Something went wrong applying autoexec, please do it manually.");
    }

    const check = async () => {
        let valid = await Setup.checkAutoexec();

        if(valid) toast.success("Your autoexec looks good!");
        else toast.error("Your autoexec appears to be incorrect.");
    }
</script>

<Heading text="Add RCON commands to your autoexec" done={Setup.autoexecValid} />

<p>The following commands need to be added to your autoexec for TFView to work:</p>
<pre>ip 0.0.0.0</pre>
<pre>rcon_password {Setup.password}</pre>
<pre>net_start</pre>
<p>Your TF2 will also need to be restarted for the changes to apply.</p>

<AutomaticManual>
    {#snippet automatic()}
        <div class="py-2">
            <button class="bg-primary p-1 px-3 rounded" onclick={autoApply}>Apply</button>
        </div>
    {/snippet}
    {#snippet manual()}
        <p>1. Open your autoexec.cfg file at [Your TF2 Install]/tf/cfg/{Setup.mastercomfig ? "overrides/" : ""}autoexec.cfg</p>
        <p>2. Paste the lines from above into it</p>
        <p>3. Press the button below to validate your changes</p>
        <button class="bg-primary p-1 px-3 rounded mt-2" onclick={check}>
            Validate
        </button>
    {/snippet}
</AutomaticManual>