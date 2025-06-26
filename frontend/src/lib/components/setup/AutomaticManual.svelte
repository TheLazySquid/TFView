<script lang="ts">
    import ChevronUp from "@lucide/svelte/icons/chevron-up";
    import type { Snippet } from "svelte";

    let { automatic, manual }: { automatic: Snippet, manual: Snippet } = $props();
    let automaticOpen = $state(false);
    let manualOpen = $state(false);
</script>

<button class="flex items-center gap-2"
    onclick={() => { automaticOpen = !automaticOpen; manualOpen = false }}>
    <div class:rotate-180={automaticOpen}>
        <ChevronUp />
    </div>
    Automatic
</button>
{#if automaticOpen}
    {@render automatic()}
{/if}
<button class="flex items-center gap-2"
    onclick={() => { manualOpen = !manualOpen; automaticOpen = false }}>
    <div class:rotate-180={manualOpen}>
        <ChevronUp />
    </div>
    Manual
</button>
{#if manualOpen}
    {@render manual()}
{/if}