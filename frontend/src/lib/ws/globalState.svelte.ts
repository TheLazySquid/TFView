import type { Tag } from "$types/data";
import { Message } from "$types/messages";
import WS from "./wsclient.svelte";

export default new class GlobalState {
    tags: Tag[] = $state.raw([]);
    
    init() {
        WS.on(Message.Tags, (tags) => {
            this.tags = tags;
        });
    }
}