<script lang="ts">
    import type { InputOptions } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import Popups from "$lib/popups";

    let options: InputOptions | null = $state.raw(null);
    let value = $state("");
    const onOpen = (opts: InputOptions) => {
        options = opts;
        if(opts.defaultValue) value = opts.defaultValue;
    }

    const cancel = () => {
        Popups.closePopup?.();
    }

    const confirm = () => {
        if(!value.trim()) return;

        options?.callback(value.trim());
        Popups.closePopup?.();
    }
</script>

<Popup type="openInputPopup" {onOpen}>
    <Dialog.Header>
        <Dialog.Title>{options?.title}</Dialog.Title>
    </Dialog.Header>
    <input class="border-b border-zinc-600 px-2 py-1" bind:value={value} />
    <Dialog.Footer>
        <Button class="text-white bg-transparent! underline" onclick={cancel}>Cancel</Button>
        <Button class="text-white" onclick={confirm}>Confirm</Button>
    </Dialog.Footer>
</Popup>