import { Message, Recieves } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class Updater {
    updateProgress = $state(0);
    status = $state("idle");

    constructor() {
        WS.on(Message.UpdateProgress, (progress) => {
            this.status = "downloading";
            this.updateProgress = progress;
        });

        WS.on(Message.InstallingUpdate, () => {
            this.status = "installing";
        });

        WS.on(Message.UpdateDone, () => {
            this.status = "done";
        });
    }

    startUpdate() {
        WS.send(Recieves.WantsToUpdate, "now");
        this.status = "waiting";
    }
}