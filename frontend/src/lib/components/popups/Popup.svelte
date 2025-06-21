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
        group?: number;
    }

    let { type, onOpen, onClose, children, class: className = "", style = "", group, ...restProps }: Props = $props();
    let modalOpen = $state(false);
    let zIndex = $state(50);

    export function closePopup() {
        modalOpen = false;
        Popups.openPopups--;
        if(group !== undefined) Popups.closePopup[group] = undefined;
    }

    Popups[type] = async (...args: any) => {
        if(group !== undefined) Popups.closePopup[group]?.();
        if(onOpen) await onOpen(...args);
        
        modalOpen = true;
        Popups.openPopups++;
        zIndex = Popups.openPopups + 50;

        if(group !== undefined) {
            Popups.closePopup[group] = () => {
                modalOpen = false;
                Popups.closePopup[group] = undefined;
                Popups.openPopups--;
                onClose?.();
            }
        }
    }

    const onOpenChange = (open: boolean) => {
        if(open) return;
        
        Popups.openPopups--;
        onClose?.();
        if(group !== undefined) Popups.closePopup[group] = undefined;
    }
</script>

<Dialog.Root bind:open={modalOpen} {onOpenChange}>
    <Dialog.Content style="z-index: {zIndex}; {style}" class={className} {...restProps}>
        {@render children()}
    </Dialog.Content>
</Dialog.Root>