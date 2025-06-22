<script lang="ts">
    import * as Select from "$lib/components/ui/select";

    interface Props {
        options: Record<string, string>;
        value: string;
    }

    let { options, value = $bindable() }: Props = $props();
</script>


<Select.Root type="single" bind:value>
    <Select.Trigger>
        {options[value]}
    </Select.Trigger>
    <Select.Content>
        {#each Object.entries(options) as [value, label]}
            <Select.Item {value} {label}>
                {label}
            </Select.Item>
        {/each}
    </Select.Content>
</Select.Root>