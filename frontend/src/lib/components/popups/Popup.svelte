<script lang="ts">
    import type { Dialog as DialogPrimitive } from "bits-ui";
    import type { PopupsType } from "$lib/popups";
    import Popups from "$lib/popups";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { Snippet } from "svelte";

    interface Props extends DialogPrimitive.ContentProps {
        type: keyof PopupsType;
        onOpen?: (...args: any[]) => (void | Promise<void>);
        onClose?: () => void;
        children: Snippet;
        class?: string;
        style?: string;
    }

    let { type, onOpen, onClose, children, class: className = "", style = "", ...restProps }: Props = $props();
    let modalOpen = $state(false);

    Popups[type] = async (...args: any) => {
        Popups.closePopup?.();

        modalOpen = true;
        
        if(onOpen) await onOpen(...args);

        Popups.closePopup = () => {
            modalOpen = false;
            Popups.closePopup = undefined;
        }
    }

    const onOpenChange = (open: boolean) => {
        if(!open) onClose?.();
    }
</script>

<Dialog.Root bind:open={modalOpen} {onOpenChange}>
    <Dialog.Content style="z-index: 50; {style}" class={className} {...restProps}>
        {@render children()}
    </Dialog.Content>
</Dialog.Root>