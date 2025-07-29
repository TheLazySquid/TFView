<script lang="ts">
    import Popups from "$lib/popups";
    import Trash from "@lucide/svelte/icons/trash-2";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import { toast } from "svelte-sonner";
    import type { PastGame } from "$types/data";

    interface Props {
        class?: string;
        game: PastGame;
        onSuccess?: () => void;
    }

    let { class: className, game, onSuccess }: Props = $props();

    const deleteGame = () => {
        Popups.open("confirm", {
            title: `Really delete game on ${game.map}?`,
            message: "This cannot be undone.",
            onConfirm: async () => {
                let res = await WS.sendAndRecieve(Recieves.DeleteGame, game.rowid);

                if(res === true) {
                    onSuccess?.();
                    toast.success("Game deleted successfully.");
                } else {
                    toast.error(res);
                }
            }
        });
    }
</script>

<button class={className} onclick={deleteGame}>
    <Trash size={16} color="#8e0202" />
</button>