import { Message } from "$types/messages";
import { SvelteSet } from "svelte/reactivity";
import WS from "../wsclient.svelte";

export default new class UserFriends {
    ids = new SvelteSet<string>();

    constructor() {
        WS.on(Message.UserFriendIds, (tags) => {
            this.ids.clear();
            tags.forEach((id) => this.ids.add(id));
        });
    }
}