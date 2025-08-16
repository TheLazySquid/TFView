<script lang="ts">
    import type { Snippet } from "svelte";

    let { children, class: className = "" }: { children: Snippet, class: string } = $props();
</script>

<div class="text-center leading-0.5 border-b border-primary text-primary my-2 {className}">
    <span class="bg-background px-2">
        {@render children()}
    </span>
</div>