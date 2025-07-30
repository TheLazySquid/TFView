import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class KillTracker {
    counts: Record<string, [number, number]> = $state({});

    constructor() {
        WS.on(Message.KillCounts, (data) => {
            this.counts = data;
        });

        WS.on(Message.KillCountUpdate, ({ weapon, count }) => {
            this.counts[weapon] = count;
        });
    }
}