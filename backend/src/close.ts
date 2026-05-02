import Log from "./log";
import EventEmitter from "node:events";

interface CloseEvents {
    close: [];
}

export default new class Close extends EventEmitter<CloseEvents> {
    isClosed = false;

    close() {
        Log.info("Closing backend");
        this.isClosed = true;
        this.emit("close");

        setTimeout(this.forceClose.bind(this), 2500).unref();
    }

    async forceClose() {
        await Log.warning("Failed to close gracefully, force closing");
        process.exit(0);
    }
}