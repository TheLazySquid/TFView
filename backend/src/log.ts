import { join } from "path";
import fsp from "fs/promises";
import { root } from "./consts";

export default class Log {
    static logPath: string;

    static init() {
        this.logPath = join(root, "tfview.log");
        fsp.writeFile(this.logPath, "");
    }

    static async addLog(type: string, text: string, logfn: (text: string) => void) {
        logfn(text);
        await fsp.appendFile(this.logPath, `[${type}] ${text}\n`);
    }

    static info(...text: any[]) {
        return this.addLog("Info", text.join(" "), console.log);
    }

    static warning(...text: any[]) {
        return this.addLog("Warning", text.join(" "), console.warn);
    }

    static error(...text: any[]) {
        return this.addLog("Error", text.join(" "), console.error);
    }
}