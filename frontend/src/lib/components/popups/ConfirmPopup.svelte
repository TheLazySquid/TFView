<script lang="ts">
    import type { ConfirmOptions } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";

    let options: ConfirmOptions | null = $state.raw(null);
    const onOpen = (opts: ConfirmOptions) => {
        options = opts;
        return opts.title || "Confirm";
    }

    let popup: Popup;
    const onCancel = () => {
        options?.onCancel?.();
        popup.closePopup();
    }

    const onConfirm = () => {
        options?.onConfirm();
        popup.closePopup();
    }
</script>

<Popup type="confirm" {onOpen} overlay={true} bind:this={popup}>
    <Dialog.Header>
        <Dialog.Title>{options?.title}</Dialog.Title>
    </Dialog.Header>
    {#if options?.message}
        <Dialog.Description>{options.message}</Dialog.Description>
    {/if}
    <Dialog.Footer>
        <Button class="text-white bg-transparent! underline" onclick={onCancel}>Cancel</Button>
        <Button class="text-white" onclick={onConfirm}>Confirm</Button>
    </Dialog.Footer>
</Popup>