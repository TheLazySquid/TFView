<script lang="ts">
    import Setup from "$lib/ws/pages/setup.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Heading from "./Heading.svelte";

    const saveSteam = () => {
        WS.send(Recieves.UpdateSetting, { key: "steamApiKey", value: Setup.steamApiKey });
    }

    const saveMAC = () => {
        WS.send(Recieves.UpdateSetting, { key: "masterbaseKey", value: Setup.masterbaseKey });
    }
</script>

<Heading text="Optional Integrations" done={true} />
<h2 class="font-semibold text-lg">Steam API Key</h2>
<p class="text-sm">
    This allows you to see the profile pictures of others in your game. Go to
    <a href="https://steamcommunity.com/dev/apikey" target="_blank" class="underline">
        https://steamcommunity.com/dev/apikey
    </a>
    and enter anything in the domain field. Then, paste the API key below.
</p>
<input bind:value={Setup.steamApiKey} onchange={saveSteam} type="password"
    placeholder="Steam API Key" class="w-full border-b border-gray-300 outline-none mt-1" />

<h2 class="font-semibold text-lg mt-3">MegaAntiCheat masterbase key</h2>
<p class="text-sm">
    This allows TFView to upload auto-recorded demos to
    <a href="https://github.com/MegaAntiCheat" target="_blank" class="underline">
        MegaAntiCheat
    </a>
    (MAC) so they can be processed. MAC is currently in development, once released this will allow you to
    see known cheaters in your server. To enable, go to
    <a href="https://megaanticheat.com/provision" target="_blank" class="underline">
        https://megaanticheat.com/provision
    </a>
    then paste the key below. It is also recommended to enable auto-recording demos by typing "ds_enable 2" in the TF2 console.
</p>
<input bind:value={Setup.masterbaseKey} onchange={saveMAC} type="password"
    placeholder="MAC Api Key" class="w-full border-b border-gray-300 outline-none mt-1" />