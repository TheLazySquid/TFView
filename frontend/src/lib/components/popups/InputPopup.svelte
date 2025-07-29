<script lang="ts">
    import type { InputOptions } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";

    let options: InputOptions | null = $state.raw(null);
    let value = $state("");
    const onOpen = (opts: InputOptions) => {
        options = opts;
        if(opts.defaultValue) value = opts.defaultValue;
        return opts.title || "Input";
    }

    let popup: Popup;
    const cancel = () => {
        popup.closePopup();
    }

    const confirm = () => {
        if(!options?.textarea && !value.trim()) return;

        options?.callback(value.trim());
        popup.closePopup();
    }

    const onkeydown = (e: KeyboardEvent) => {
        if(e.key === "Enter") confirm();
    }
</script>

<Popup type="input" {onOpen} overlay={true} bind:this={popup}>
    <Dialog.Header>
        <Dialog.Title>{options?.title}</Dialog.Title>
    </Dialog.Header>
    {#if options?.textarea}
        <textarea class="resize-y p-1 h-[200px] outline not-focus:outline-zinc-600" bind:value={value}></textarea>
    {:else}
        <input class="border-b not-focus:border-zinc-600 px-2 py-1" bind:value={value} {onkeydown} />
    {/if}
    <Dialog.Footer>
        <Button class="text-white bg-transparent! underline" onclick={cancel}>Cancel</Button>
        <Button class="text-white" onclick={confirm}>Confirm</Button>
    </Dialog.Footer>
</Popup>