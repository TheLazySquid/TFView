import { SvelteSet } from "svelte/reactivity"
import WS from "../wsclient.svelte";
import { Message } from "$types/messages";

export default new class PlayerIds {
    ids = new SvelteSet<string>();

    constructor() {
        WS.on(Message.InitialPlayerIds, (ids) => {
            this.ids.clear();
            for(let id of ids) this.ids.add(id);
        });

        WS.on(Message.PlayerIdClear, () => {
            this.ids.clear();
        });

        WS.on(Message.PlayerIdJoin, (id) => {
            this.ids.add(id);
        });

        WS.on(Message.PlayerIdLeave, (id) => {
            this.ids.delete(id);
        });
    }
}