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

    Popups[type] = (...args: any) => {
        Popups.closePopup?.();

        modalOpen = true;
        onOpen(...args);

        Popups.closePopup = () => {
            modalOpen = false;
            Popups.closePopup = undefined;
        }
    }
</script>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content style="z-index: 50; {style}" class={className}>
        {@render children()}
    </Dialog.Content>
</Dialog.Root>