<script lang="ts">
    import Settings from "$lib/ws/settings.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import type { SettingsType } from "$types/data";
    import { Recieves } from "$types/messages";
    import EyeOpen from "@lucide/svelte/icons/eye";
    import EyeClosed from "@lucide/svelte/icons/eye-off";
    import Tags from "./Tags.svelte";

    Settings.init();
    
    interface Setting {
        name: string;
        id: keyof SettingsType;
        type: "string" | "password" | "number";
    }

    const settings: Setting[] = [
        { name: "Steam Path", id: "steamPath", type: "string" },
        { name: "TF Path", id: "tfPath", type: "string" },
        { name: "RCON Port", id: "rconPort", type: "number" },
        { name: "RCON Password", id: "rconPassword", type: "password" },
        { name: "Steam API Key", id: "steamApiKey", type: "password" },
        { name: "MegaAntiCheat Api Key", id: "masterbaseKey", type: "password" }
    ]

    let passwordsOpen: Record<string, boolean> = $state({});
</script>

<div class="flex justify-center pt-5">
    <div style="width: min(750px, 60%)">
        <h1 class="text-2xl verdana col-span-2">Settings</h1>
        <div class="grid gap-y-2" style="grid-template-columns: 1fr 300px;">
            {#each settings as setting}
                {@const onchange = () => WS.send(Recieves.UpdateSetting, { key: setting.id, value: Settings.settings[setting.id]})}
                <div>{setting.name}</div>
    
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
                {/if}
            {/each}
        </div>
        <Tags />
    </div>
</div>