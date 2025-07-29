<script lang="ts">
    import type { Dialog as DialogPrimitive } from "bits-ui";
    import type { PopupArguments } from "$lib/popups";
    import Popups from "$lib/popups";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { Snippet } from "svelte";
    import popups from "$lib/popups";

    interface Props extends DialogPrimitive.ContentProps {
        type: keyof PopupArguments;
        onOpen: (args: any) => (string | Promise<string>);
        onClose?: () => void;
        children: Snippet;
        class?: string;
        style?: string;
        overlay?: boolean;
    }

    let { type, onOpen, onClose, children, class: className = "", style = "", overlay = false, ...restProps }: Props = $props();
    let modalOpen = $state(false);
    let zIndex = $state(50);
    let backName: string | null = $state(null);

    export function closePopup() {
        modalOpen = false;
        Popups.onClose(overlay);
    }

    async function openPopup(args: any) {
        let name = await onOpen(args);
        
        modalOpen = true;
        zIndex = Popups.openPopups + 50;
        backName = Popups.popupStack.length > 0 ? Popups.popupStack[Popups.popupStack.length - 1].name : null;
    
        return {
            close: () => modalOpen = false,
            name: name
        }
    }

    Popups.register(type, overlay, openPopup);

    const onOpenChange = (open: boolean) => {
        if(open) return;
        
        onClose?.();
        Popups.onClose(overlay);
    }
</script>

<Dialog.Root bind:open={modalOpen} {onOpenChange}>
    <Dialog.Content style="z-index: {zIndex}; {style}" class={className} {...restProps}>
        {#if !overlay && backName}
            <button class="text-xs absolute top-1 left-6 text-gray-400" onclick={() => Popups.goBack()}>
                &lt; {backName}
            </button>
        {/if}
        {@render children()}
    </Dialog.Content>
</Dialog.Root>