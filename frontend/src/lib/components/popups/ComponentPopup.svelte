<script module lang="ts">
    import type { Component } from "svelte";
    import * as Dialog from "$lib/components/ui/dialog";

    let OpenComponent: Component | null = $state(null);
    let open = $state(false);

    export function show(component: Component) {
        OpenComponent = component;
        open = true;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Overlay class="z-51" />
    <Dialog.Content class="z-51">
        <OpenComponent />
    </Dialog.Content>
</Dialog.Root>