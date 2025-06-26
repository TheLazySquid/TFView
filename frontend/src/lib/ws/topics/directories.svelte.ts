import type { GameDirInfo } from "$types/data";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class Directories {
    steam: GameDirInfo = $state.raw({ path: "", valid: false });
    tf: GameDirInfo = $state.raw({ path: "", valid: false });
    valid = $derived(this.steam.valid && this.tf.valid);

    constructor() {
        WS.on(Message.Directories, (directories) => {
            this.steam = directories.steam;
            this.tf = directories.tf;
        });
    }
}