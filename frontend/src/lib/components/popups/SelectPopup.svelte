<script lang="ts">
    import type { SelectOptions } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";

    let options: SelectOptions | null = $state.raw(null);
    let selectedValue: string | undefined = $state(undefined);
    const onOpen = (opts: SelectOptions) => {
        options = opts;
        selectedValue = undefined;
        return opts.title || "Select";
    }

    let popup: Popup;
    const onCancel = () => {
        popup.closePopup();
    }

    const onConfirm = () => {
        if(selectedValue) options?.onConfirm(selectedValue);
        popup.closePopup();
    }

    let selectedLabel = $derived(options!?.options.find((o) => o.value === selectedValue)?.label ?? "Select Option");
</script>

<Popup type="select" {onOpen} overlay={true} bind:this={popup}>
    <Dialog.Header>
        <Dialog.Title>{options?.title}</Dialog.Title>
    </Dialog.Header>
    <Select.Root type="single" bind:value={selectedValue}>
        <Select.Trigger>
            {selectedLabel}
        </Select.Trigger>
        <Select.Content class="z-100">
            {#each options?.options as option (option.value)}
                <Select.Item value={option.value} label={option.label}>
                    {option.label}
                </Select.Item>
            {/each}
        </Select.Content>
    </Select.Root>
    <Dialog.Footer>
        <Button class="text-white bg-transparent! underline" onclick={onCancel}>Cancel</Button>
        <Button class="text-white" disabled={!selectedValue} onclick={onConfirm}>Confirm</Button>
    </Dialog.Footer>
</Popup>