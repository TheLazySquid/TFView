<script lang="ts">
    import type { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import { Button } from "$lib/components/ui/button";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        singular: string;
        plural: string;
        list: InfiniteList<any, any>;
        children: Snippet;
    }

    let { title, list, singular, plural, children }: Props = $props();
</script>

<div class="w-full rounded-xl border-2 border-accent p-3 mb-3">
    <h2 class="verdana text-xl mb-2">{title}</h2>
    <div class="grid gap-2 mb-3" style="grid-template-columns: auto 1fr">
        {@render children()}
    </div>
    <div class="flex items-center gap-3">
        <Button class="text-white" onclick={() => list.resetSearch()}>Search</Button>
        <Button class="text-white" onclick={() => list.clearSearch()}>Clear Search</Button>
        {#if list.total !== undefined}
            <div>{list.total} total {list.total === 1 ? singular : plural}</div>
        {/if}
    </div>
</div>