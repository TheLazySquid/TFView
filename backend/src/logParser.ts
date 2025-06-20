import fs from "node:fs";
import { join } from "node:path";
import Settings from "./settings/settings";
import Log from "./log";

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
        this.logPath = join(Settings.get("tfPath"), "console.log");
        this.logFile = Bun.file(this.logPath);
        this.poll();

        // fs.watch can't be relied on for log updates, somehow the log
        // doesn't trigger whatever listeners it uses
        setInterval(() => this.poll(), this.pollInterval);
    }

    static on(regex: RegExp, callback: (data: RegExpExecArray) => void) {
        this.listeners.push({ regex, callback });
    }

    static shouldRestart = true;
    static poll() {
        this.logFile.stat()
            .then(stat => {
                if(this.shouldRestart) {
                    this.shouldRestart = false;
                    this.readStart = stat.size;
                    Log.info("Restarting reading of logfile");
                } else if(stat.size > this.readStart) {
                    this.readLog();
                } else if(stat.size < this.readStart) {
                    Log.info("Moving back in logfile");
                    this.readStart = stat.size;
                }
            })
            .catch(() => {
                if(!this.shouldRestart) Log.warning("Failed to stat logfile");
                this.shouldRestart = true;
            })
    }

    static readLog() {
        const stream = fs.createReadStream(this.logPath, {
            start: this.readStart
        });

        let added = "";
        stream.once("data", (buffer) => added += buffer);
        stream.once("close", () => {
            this.readStart += added.length;
            this.parseLog(added.replaceAll("\r\n", "\n"))
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