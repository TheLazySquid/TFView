<script lang="ts">
    import type { PopupsType } from "$lib/popups";
    import Popups from "$lib/popups";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { Snippet } from "svelte";

    interface Props {
        type: keyof PopupsType;
        onOpen: (...args: any[]) => void;
        children: Snippet;
        class?: string;
        style?: string;
    }

    let { type, onOpen, children, class: className = "", style = "" }: Props = $props();
    let modalOpen = $state(false);

    const baseZIndex = 50;
    let zIndex = $state(baseZIndex + Popups.popupsOpen);

    Popups[type] = (...args: any) => {
        Popups.popupsOpen++;
        zIndex = baseZIndex + Popups.popupsOpen;
        modalOpen = true;
        onOpen(...args);
    }

    const onOpenChange = (open: boolean) => {
        if(open) return;
        Popups.popupsOpen--;
    }
</script>

<Dialog.Root bind:open={modalOpen} {onOpenChange}>
    <Dialog.Content style="z-index: {zIndex}; {style}" class={className}>
        {@render children()}
    </Dialog.Content>
</Dialog.Root>