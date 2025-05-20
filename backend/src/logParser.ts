import fs from "node:fs";
import { join } from "node:path";
import Config from "./config";

interface LogListener {
    regex: RegExp;
    callback: (data: RegExpExecArray) => void;
}

export default class LogParser {
    static logFile: Bun.BunFile;
    static logPath: string;
    static readStart = 0;
    static pollInterval = 1000;
    static listeners: LogListener[] = [];

    static init() {
        // watch the log for updates
        let logExists = false;
        this.logPath = join(Config.get("tf2Path"), "tf", "console.log");
        this.logFile = Bun.file(this.logPath);
        this.logFile.exists().then((exists) => logExists = exists);
        this.logFile.stat().then(s => this.readStart = s.size);

        // fs.watch can't be relied on for log updates, somehow the log
        // doesn't trigger whatever listeners this uses
        fs.watch(this.logPath, (type) => {
            if(type === "rename") {
                logExists = !logExists;
                if(!logExists) return;

                this.logFile.stat().then(s => this.readStart = s.size);
                return;
            }
        });

        setInterval(() => this.poll(), this.pollInterval);
    }

    static on(regex: RegExp, callback: (data: RegExpExecArray) => void) {
        this.listeners.push({ regex, callback });
    }

    static poll() {
        this.logFile.stat().then(stat => {
            if(stat.size > this.readStart) this.readLog();
        });
    }

    static readLog() {
        const stream = fs.createReadStream(this.logPath, {
            start: this.readStart
        });

        let added = "";
        stream.once("data", (buffer) => added += buffer);
        stream.once("close", () => {
            this.readStart += added.length;
            this.parseLog(added)
        });
    }

    static parseLog(text: string) {
        let match: RegExpExecArray;
        for(let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            while(match = listener.regex.exec(text)) {
                listener.callback(match);
            }
        }
    }
}