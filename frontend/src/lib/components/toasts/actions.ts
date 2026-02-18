import { toast } from "svelte-sonner";
import ActionsToast from "./ActionsToast.svelte";
import { openToasts } from "./state";
 
interface Action {
    label: string;
    onClick: () => void;
}

export function createActionToast(id: string, text: string, actions: Action[]) {
    if(openToasts.includes(id)) return;
    openToasts.push(id);

    toast(ActionsToast, {
        duration: Number.POSITIVE_INFINITY,
        componentProps: { text, actions, id },
        id,
        class: "action-toast-wrap"
    });
}