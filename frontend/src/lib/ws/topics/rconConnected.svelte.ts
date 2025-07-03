import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class RconConnected {
    connected = $state(false);

    constructor() {
        WS.on(Message.RconConnected, (connected) => {
            this.connected = connected;
        });
    }
}