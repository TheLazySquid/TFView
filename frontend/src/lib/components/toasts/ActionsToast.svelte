<script lang="ts">
    import { toast } from "svelte-sonner";

    interface Action {
        label: string;
        onClick: () => void;
    }

    interface Props {
        text: string;
        actions: Action[];
        id: string;
    }

    let { text, actions, id }: Props = $props();

    function onClick(action: Action) {
        toast.dismiss(id);
        action.onClick();
    }
</script>

<div class="pb-2">{text}</div>
<div class="w-full flex justify-end gap-1">
    {#each actions as action}
        <button onclick={() => onClick(action)}
        class="bg-gray-100 text-black rounded px-2 text-xs h-6">
            {action.label}
        </button>
    {/each}
</div>

<style>
    :global(.action-toast-wrap > div) {
        width: 100%;
    }
</style>