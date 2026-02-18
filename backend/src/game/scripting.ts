import LogParser from "./logParser";
import Log from "src/log";
import { join } from "path";
import { dataPath } from "src/consts";
import type { PersistentScript, PersistentScriptContext, ScriptContext } from "$types/scripting";
import Server from "src/net/server";
import { Message } from "$types/messages";
import Settings from "src/settings/settings";
import Rcon from "./rcon";
import { watch } from "chokidar";
import fsp from "node:fs/promises";

export default class Scripting {
    static scriptPath = join(dataPath, "scripts");
    static execRegex = /(?:\n|^)tfview\.(\w+)\s*\((.*)\)\s*(?=\n|$)/g;
    static init() {
        // Create the script directory if it doesn't exist
        fsp.exists(this.scriptPath).then((exists) => {
            if(exists) return;
            fsp.mkdir(this.scriptPath);
        });

        LogParser.on(this.execRegex, (match) => {
            const [, script, argsString] = match;
            this.runScript(script, argsString);
        });

        this.startPersistent();
    }

    static persistent = new Map<string, PersistentScript>();
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

            const existing = this.persistent.get(name);
            if(!existing) return;

            exports.exports?.close?.call(null, existing.context);
            existing.cleanup.forEach((cb) => cb());
            this.persistent.delete(name);
        });

        // Re-run the script when it updates (we can reuse the same context)
        watcher.on("change", (path) => {
            const [, name] = path.match(this.persistentRegex);

            const existing = this.persistent.get(name);
            existing.exports?.close?.call(null, existing.context);
            existing.cleanup.forEach((cb) => cb());
            
            this.runPersistent(path, name);
        });
    }

    static async runPersistent(path: string, name: string) {    
        try {
            const { cleanup, context } = this.createPersistentContext(name);

            const exports = await import(`${path}?t=${Date.now()}`);
            exports.init?.call(null, context);

            this.persistent.set(name, {
                exports,
                cleanup,
                context
            });

            Log.info(`Started persistent script ${name}`);
        } catch(e) {
            Log.warning(`Error running persistent script ${name}`, e);
        }
    }

    static async runScript(script: string, argsString: string) {
        const args = argsString.split(",").map(arg => arg.trim());

        const persistent = this.persistent.get(script);
        if(persistent) {
            try {
                persistent.exports?.run?.call(null, persistent.context, ...args);
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
                success: (message) => Server.send("global", Message.Success, message),
                warning: (message) => Server.send("global", Message.Warning, message),
                error: (message) => Server.send("global", Message.Error, message)
            },
            log: {
                info: (...messages) => Log.info(`[${script}]`, ...messages),
                warning: (...messages) => Log.warning(`[${script}]`, ...messages),
                error: (...messages) => Log.error(`[${script}]`, ...messages)
            },
            rcon: {
                run: (command) => Rcon.run(command)
            },
            get tfPath() { return Settings.get("tfPath") },
            get steamPath() { return Settings.get("steamPath") }
        }
    }

    static createPersistentContext(script: string) {
        const cleanup: (() => void)[] = [];
        const context: PersistentScriptContext = {
            ...this.createContext(script),
            watchConsole: (regex, callback) => {
                if(!(regex instanceof RegExp)) throw new Error("First argument must be regex");
                if(!regex.global) throw new Error("Regex must be global");

                const wrappedCallback = (data: RegExpExecArray) => {
                    try {
                        callback(data);
                    } catch(e) {
                        Log.error("Error in watchConsole callback for", script, e);
                    }
                }

                const cancel = LogParser.on(regex, wrappedCallback);
                cleanup.push(cancel);

                return () => {
                    const index = cleanup.indexOf(cancel);
                    if(index !== -1) cleanup.splice(index, 1);

                    cancel();
                }
            }
        }

        return { cleanup, context }
    }
}