import LogParser from "./logParser";
import Log from "src/log";
import { join } from "path";
import { dataPath } from "src/consts";
import type { ScriptContext } from "$types/scripting";
import Server from "src/net/server";
import { Message } from "$types/messages";
import Settings from "src/settings/settings";
import Rcon from "./rcon";
import { watch } from "chokidar";

export default class Scripting {
    static scriptPath = join(dataPath, "scripts");
    static execRegex = /(?:\n|^)tfview\.(\w+)\s*\((.*)\)\s*(?=\n|$)/g;
    static init() {
        LogParser.on(this.execRegex, (match) => {
            const [, script, argsString] = match;
            this.runScript(script, argsString);
        });

        this.startPersistent();
    }

    static persistent = new Map<string, any>();
    static persistentContexts = new Map<string, ScriptContext>();
    static persistentRegex = /(\w+)\.persistent\.(js|ts)$/;
    static async startPersistent() {
        const watcher = watch(this.scriptPath, {
            ignored: (file, stats) => stats?.isFile() && !this.persistentRegex.test(file),
            persistent: false,
            ignoreInitial: false,
            depth: 1
        });

        // Create scripts initially and when they're added
        watcher.on("add", (path) => {
            const [, name] = path.match(this.persistentRegex);
            this.runPersistent(path, name);
        });

        // Close the script when it's deleted
        watcher.on("unlink", (path) => {
            const [, name] = path.match(this.persistentRegex);

            const exports = this.persistent.get(name);
            exports?.close?.call(null, this.persistentContexts.get(name));
            this.persistent.delete(name);
            this.persistentContexts.delete(name);
        });

        // Re-run the script when it updates (we can reuse the same context)
        watcher.on("change", (path) => {
            const [, name] = path.match(this.persistentRegex);

            const exports = this.persistent.get(name);
            const context = this.persistentContexts.get(name);
            exports?.close?.call(null, context);
            
            this.runPersistent(path, name, context);
        });
    }

    static async runPersistent(path: string, name: string, context?: ScriptContext) {
        context = this.createContext(name);
    
        try {
            const exports = await import(`${path}?t=${Date.now()}`);
            exports.init?.call(null, context);
            this.persistent.set(name, exports);
            this.persistentContexts.set(name, context);
            Log.info(`Started persistent script ${name}`);
        } catch(e) {
            Log.warning(`Error running persistent script ${name}`, e);
        }
    }

    static async runScript(script: string, argsString: string) {
        const args = argsString.split(",").map(arg => arg.trim());

        const persistentExports = this.persistent.get(script);
        if(persistentExports) {
            try {
                const context = this.persistentContexts.get(script);
                persistentExports.run?.call(null, context, ...args);
            } catch(e) {
                Log.warning(`Error running persistent script ${script}`, e);
            }
            return;
        }

        // Allow for both .js and .ts imports
        const path = join(this.scriptPath, script);
        const context = this.createContext(script);

        try {
            const exports = await import(`${path}?t=${Date.now()}`);
            exports.run?.call(null, context, ...args);
        } catch(e) {
            Log.warning(`Error running script ${script}`, e);
        }
    }

    static createContext(script: string): ScriptContext {
        return {
            toast: {
                success: (message: string) => Server.send("global", Message.Success, message),
                warning: (message: string) => Server.send("global", Message.Warning, message),
                error: (message: string) => Server.send("global", Message.Error, message)
            },
            log: {
                info: (...messages: string[]) => Log.info(`[${script}]`, ...messages),
                warning: (...messages: string[]) => Log.warning(`[${script}]`, ...messages),
                error: (...messages: string[]) => Log.error(`[${script}]`, ...messages)
            },
            rcon: {
                run: (command: string) => Rcon.run(command)
            },
            get tfPath() { return Settings.get("tfPath") },
            get steamPath() { return Settings.get("steamPath") }
        }
    }
}