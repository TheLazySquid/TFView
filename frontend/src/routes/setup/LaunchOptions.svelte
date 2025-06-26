<script lang="ts">
    import AutomaticManual from "$lib/components/setup/AutomaticManual.svelte";
    import Setup from "$lib/ws/pages/setup.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import { toast } from "svelte-sonner";
    import Heading from "./Heading.svelte";

    Setup.checkLaunchOptions();

    const autoApply = async () => {
        let success = await WS.sendAndRecieve(Recieves.ApplyLaunchOptions, undefined); 
        if(success) Setup.launchOptionsValid = true;

        if(success) toast.success("Successfully applied launch options and killed steam!")
        else toast.error("Something went wrong applying launch options, please do it manually.");
    }

    const check = async () => {
        let valid = await Setup.checkLaunchOptions();

        if(valid) toast.success("Your launch options look good!");
        else toast.error("Your launch options appear to be incorrect.");
    }
</script>

<Heading text="Add needed launch options" done={Setup.launchOptionsValid} />
<p>TF2 needs to have following launch options for TFView to work:</p>
<pre>-condebug -conclearlog -usercon -g15</pre>
<AutomaticManual>
    {#snippet automatic()}
        <div class="py-2">
            <button class="bg-primary p-1 px-3 rounded" onclick={autoApply}>Apply (will kill steam)</button>
        </div>
    {/snippet}
    {#snippet manual()}
        <p>1. Right click on TF2 in your steam library</p>
        <p>2. Select "Properties"</p>
        <p>3. Paste the options from above into "Launch Options"</p>
        <p>4. Press the button below to validate your changes</p>
        <button class="bg-primary p-1 px-3 rounded mt-2" onclick={check}>
            Validate
        </button>
    {/snippet}
</AutomaticManual>