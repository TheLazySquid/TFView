<script lang="ts">
    import type { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import { getContext } from "svelte";

    let { value = $bindable() }: { value?: string } = $props();
    const list = getContext<InfiniteList<any, any>>("searchList");

    const onKeydown = (e: KeyboardEvent) => {
        if(e.key === "Enter") list.updateSearch();
    }
</script>

<input bind:value class="{ value ? "border-green-300" : "border-white"}
    border outline-none rounded-sm p-0.5" onkeydown={onKeydown} />