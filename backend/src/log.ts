import { join } from "path";
import fsp from "fs/promises";

export default class Log {
    static logPath: string;

    static init() {
        this.logPath = join(__dirname, "..", "tfview.log");
        fsp.writeFile(this.logPath, "");
    }

    static addLog(type: string, text: string, logfn: (text: string) => void) {
        fsp.appendFile(this.logPath, `[${type}] ${text}\n`);
        logfn(text);
    }

    static info(...text: string[]) {
        this.addLog("Info", text.join(" "), console.log);
    }

    static warning(...text: string[]) {
        this.addLog("Warning", text.join(" "), console.warn);
    }

    static error(...text: string[]) {
        this.addLog("Error", text.join(" "), console.error);
    }
}