<script lang="ts">
    import type { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import { watch } from "runed";
    import { getContext } from "svelte";

    interface Props {
        timestamp?: number;
        list?: InfiniteList<any, any>;
    }

    let { timestamp = $bindable(), list }: Props = $props();
    const searchList = list ?? getContext<InfiniteList<any, any>>("searchList");

    let input: HTMLInputElement;
    let valid = $derived(timestamp !== undefined);

    let ignoreNext = false;
    watch(() => timestamp, () => {
        if(ignoreNext) {
            ignoreNext = false;
            return;
        }

        input.valueAsNumber = timestamp ?? NaN;
    });

    const update = () => {
        ignoreNext = true;
        if(isNaN(input.valueAsNumber)) timestamp = undefined;
        else timestamp = input.valueAsNumber;

        searchList.updateSearch();
    }
</script>

<input type="date" bind:this={input} onchange={update}
    class="border { valid ? "border-green-300" : "border-white"} outline-none rounded-sm p-0.5" />