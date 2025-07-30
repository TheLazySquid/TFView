<script lang="ts">
    import type { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import { getContext } from "svelte";

    interface Props {
        value?: string;
        list?: InfiniteList<any, any>;
    }

    let { value = $bindable(), list }: Props = $props();
    const searchList = list ?? getContext<InfiniteList<any, any>>("searchList");

    const onKeydown = (e: KeyboardEvent) => {
        if(e.key === "Enter") searchList.updateSearch();
    }
</script>

<input bind:value class="{ value ? "border-green-300" : "border-white"}
    border outline-none rounded-sm p-0.5" onkeydown={onKeydown} />