<script lang="ts">
    import type { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import * as Select from "$lib/components/ui/select";
    import { getContext } from "svelte";

    interface Props {
        options: Record<string, string>;
        value: string;
        class?: string;
        list?: InfiniteList<any, any>;
    }

    let { options, value = $bindable(), class: className, list }: Props = $props();
    const searchList = list ?? getContext<InfiniteList<any, any>>("searchList");

    const onChange = () => {
        searchList.updateSearch();
    }
</script>


<Select.Root type="single" bind:value onValueChange={onChange}>
    <Select.Trigger class={className}>
        {options[value]}
    </Select.Trigger>
    <Select.Content class="z-[100]">
        {#each Object.entries(options) as [value, label]}
            <Select.Item {value} {label}>
                {label}
            </Select.Item>
        {/each}
    </Select.Content>
</Select.Root>