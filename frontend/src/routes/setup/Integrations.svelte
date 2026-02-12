<script lang="ts">
    import Settings from "$lib/ws/topics/settings.svelte";
    import Heading from "./Heading.svelte";
    import { watch } from "runed";
    import { show } from "$lib/components/popups/ComponentPopup.svelte";
    import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
    import SteamKeyInfo from "$lib/components/settings/SteamKeyInfo.svelte";
    import MACInfo from "$lib/components/settings/MACInfo.svelte";
    import SteamHistoryInfo from "$lib/components/settings/SteamHistoryInfo.svelte";

    watch(() => Settings.settings.steamApiKey, () => Settings.update("steamApiKey"));
    watch(() => Settings.settings.masterbaseKey, () => Settings.update("masterbaseKey"));
    watch(() => Settings.settings.steamhistoryApiKey, () => Settings.update("steamhistoryApiKey"));
</script>

<Heading text="Optional Integrations" done={true} />
<h2 class="font-semibold text-lg">
    Steam API Key (strongly recommended)
    <button onclick={() => show(SteamKeyInfo)}>
        <CircleQuestionMark size={16} class="text-gray-500" />
    </button>
</h2>
<input bind:value={Settings.settings.steamApiKey} type="password"
    placeholder="Steam API Key" class="w-full border-b border-gray-300 outline-none mt-1" />

<h2 class="font-semibold text-lg mt-3">
    MegaAntiCheat masterbase key
    <button onclick={() => show(MACInfo)}>
        <CircleQuestionMark size={16} class="text-gray-500" />
    </button>
</h2>
<input bind:value={Settings.settings.masterbaseKey} type="password"
    placeholder="MAC Api Key" class="w-full border-b border-gray-300 outline-none mt-1" />

<h2 class="font-semibold text-lg mt-3">
    SteamHistory API Key
    <button onclick={() => show(SteamHistoryInfo)}>
        <CircleQuestionMark size={16} class="text-gray-500" />
    </button>
</h2>
<input bind:value={Settings.settings.steamhistoryApiKey} type="password"
    placeholder="SteamHistory API Key" class="w-full border-b border-gray-300 outline-none mt-1" />