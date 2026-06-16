import { SvelteSet } from "svelte/reactivity"
import WS from "../wsclient.svelte";
import { Message } from "$types/messages";

export default new class PlayerMeta {
    currentPlayers = new SvelteSet<string>();

    constructor() {
        WS.on(Message.InitialPlayerIds, (ids) => {
            this.currentPlayers.clear();
            for(let id of ids) this.currentPlayers.add(id);
        });

        WS.on(Message.PlayerIdJoin, (id) => {
            this.currentPlayers.add(id);
        });

        WS.on(Message.PlayerIdLeave, (id) => {
            this.currentPlayers.delete(id);
        });
    }
}