<script lang="ts">
    import CircleCheck from "@lucide/svelte/icons/circle-check";

    let { text, done }: { text: string, done: boolean } = $props();
</script>

<div class="flex items-center gap-2 mb-2">
    <h1 class="text-2xl font-bold -mt-1">{ text }</h1>
    {#if done}
        <CircleCheck color="green" />
    {/if}
</div>