import { toast } from "svelte-sonner";
import ActionsToast from "./ActionsToast.svelte";
 
interface Action {
    label: string;
    onClick: () => void;
}

export function createActionToast(text: string, actions: Action[]) {
    const id = crypto.randomUUID();

    toast(ActionsToast, {
        duration: Number.POSITIVE_INFINITY,
        componentProps: { text, actions, id },
        id,
        class: "action-toast-wrap"
    });
}