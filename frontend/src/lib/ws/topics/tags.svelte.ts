import type { Tag } from "$types/data";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class Tags {
    tags: Tag[] = $state.raw([]);

    constructor() {
        WS.on(Message.Tags, (tags) => {
            this.tags = tags;
        });
    }
}