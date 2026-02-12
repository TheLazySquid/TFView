<script lang="ts">
    import Settings from "$lib/ws/topics/settings.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import type { SettingsType } from "$types/data";
    import { Recieves } from "$types/messages";
    import EyeOpen from "@lucide/svelte/icons/eye";
    import EyeClosed from "@lucide/svelte/icons/eye-off";
    import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
    import Tags from "./Tags.svelte";
    import Directory from "$lib/components/setup/Directory.svelte";
    import Directories from "$lib/ws/topics/directories.svelte";
    import { Switch } from "$lib/components/ui/switch";
    import { version } from "../../../../package.json";
    import InputPopup from "$lib/components/popups/InputPopup.svelte";
    import type { Component } from "svelte";
    import SteamKeyInfo from "$lib/components/settings/SteamKeyInfo.svelte";
    import MACInfo from "$lib/components/settings/MACInfo.svelte";
    import SteamHistoryInfo from "$lib/components/settings/SteamHistoryInfo.svelte";
    import ComponentPopup, { show } from "$lib/components/popups/ComponentPopup.svelte";

    WS.init("settings");
    
    interface Setting {
        name: string;
        id: keyof SettingsType;
        type: "string" | "password" | "number" | "switch";
        moreInfo?: Component;
    }

    const settings: Setting[] = [
        { name: "Launch TF2 when TFView is opened", id: "launchTf2OnStart", type: "switch" },
        // { name: "Open TFView UI when TFView is opened", id: "openUiOnStart", type: "switch" },
        { name: "RCON Port", id: "rconPort", type: "number" },
        { name: "RCON Password", id: "rconPassword", type: "password" },
        { name: "Steam API Key", id: "steamApiKey", type: "password", moreInfo: SteamKeyInfo },
        { name: "MegaAntiCheat API Key", id: "masterbaseKey", type: "password", moreInfo: MACInfo },
        { name: "SteamHistory API Key", id: "steamhistoryApiKey", type: "password", moreInfo: SteamHistoryInfo }
    ]

    let passwordsOpen: Record<string, boolean> = $state({});
</script>

<svelte:head>
	<title>Settings | TFView</title>
</svelte:head>

<InputPopup />
<ComponentPopup />

<div class="flex justify-center pt-5 max-h-full overflow-y-auto">
    <div style="width: min(750px, 60%)">
        <h1 class="text-2xl verdana col-span-2">
            Settings
            <span class="text-sm font-normal float-right">TFView v{version}</span>
        </h1>
        <div>
            Steam Directory
            <Directory dir={Directories.steam} type="steam" />
        </div>
        <div>
            TF Directory
            <Directory dir={Directories.tf} type="tf" />
        </div>
        <div class="grid gap-y-2" style="grid-template-columns: 1fr 300px;">
            {#if Settings.loaded}
                {#each settings as setting}
                    {@const onchange = () => WS.send(Recieves.UpdateSetting, { key: setting.id, value: Settings.settings[setting.id]})}
                    <div class="flex gap-1">
                        {setting.name}
                        {#if setting.moreInfo}
                            <button onclick={() => show(setting.moreInfo!)}>
                                <CircleQuestionMark size={16} class="text-gray-500" />
                            </button>
                        {/if}
                    </div>
        
                    {#if setting.type === "string"}
                        <input class="border-b border-zinc-600 outline-none" {onchange}
                            bind:value={Settings.settings[setting.id]} />
                    {:else if setting.type === "number"}
                        <input class="border-b border-zinc-600 outline-none" type="number" {onchange}
                            bind:value={Settings.settings[setting.id]} />
                    {:else if setting.type === "password"}
                        {@const Eye = passwordsOpen[setting.id] ? EyeOpen : EyeClosed}
                        <div class="flex items-center gap-2">
                            <input type={passwordsOpen[setting.id] ? "text" : "password"} {onchange}
                                class="grow outline-none border-b border-zinc-600"
                                bind:value={Settings.settings[setting.id]} />
                            <button onclick={() => passwordsOpen[setting.id] = !passwordsOpen[setting.id]}>
                                <Eye />
                            </button>
                        </div>
                    {:else if setting.type === "switch"}
                        <Switch bind:checked={Settings.settings[setting.id] as boolean}
                            onCheckedChange={onchange}/>
                    {/if}
                {/each}
            {/if}
        </div>
        <Tags />
    </div>
</div>