import Log from "./log";
import EventEmitter from "node:events";

interface CloseEvents {
    close: [];
}

export default new class Close extends EventEmitter<CloseEvents> {
    isClosed = false;

    close() {
        this.isClosed = true;
        Log.info("Closing backend");
        setTimeout(this.forceClose.bind(this), 2500).unref();
    }

    async forceClose() {
        await Log.warning("Failed to close gracefully, force closing");
        process.exit(0);
    }
}