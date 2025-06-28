<script lang="ts">
    import * as Select from "$lib/components/ui/select";

    interface Props {
        options: Record<string, string>;
        value: string;
        class?: string;
        onChange?: () => void;
    }

    let { options, value = $bindable(), class: className, onChange }: Props = $props();
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