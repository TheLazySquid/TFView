import { join } from "path";
import fsp from "fs/promises";
import { root } from "./consts";

export default class Log {
    static logPath: string;

    static init() {
        this.logPath = join(root, "tfview.log");
        fsp.writeFile(this.logPath, "");
    }

    static addLog(type: string, text: string, logfn: (text: string) => void) {
        fsp.appendFile(this.logPath, `[${type}] ${text}\n`);
        logfn(text);
    }

    static info(...text: any[]) {
        this.addLog("Info", text.join(" "), console.log);
    }

    static warning(...text: any[]) {
        this.addLog("Warning", text.join(" "), console.warn);
    }

    static error(...text: any[]) {
        this.addLog("Error", text.join(" "), console.error);
    }
}