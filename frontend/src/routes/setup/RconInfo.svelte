<script lang="ts">
    import { Switch } from "$lib/components/ui/switch";
    import Setup from "$lib/ws/pages/setup.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Heading from "./Heading.svelte";

    Setup.getRconInfo();

    const updatePassword = () => {
        WS.send(Recieves.UpdateSetting, { key: "rconPassword", value: Setup.password });
    }
</script>

<Heading text="Pick RCON options" done={Setup.password !== ""} />
<div class="flex items-center gap-2">
    <Switch bind:checked={Setup.mastercomfig} onCheckedChange={() => Setup.getRconInfo()} />
    Do you use mastercomfig?
</div>
<p class="text-sm text-zinc-300 mb-3">
    This affects where your autoexec.cfg file is located.
</p>
<div class="flex items-center gap-2">
    Pick an RCON password:
    <input class="border-b border-zinc-700 outline-none" spellcheck="false"
    maxlength="50" placeholder="Enter a Password" bind:value={Setup.password}
    onchange={updatePassword} />
</div>
<p class="text-sm text-zinc-300">
    You won't need to remember this password, and it can always be changed later.
    The only risk if this password is leaked is that if you happen to have port 27015 forwarded
    then others can use your TF2 console.
</p>