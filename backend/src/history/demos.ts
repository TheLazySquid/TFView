import Settings from "$src/settings/settings";
import { join } from "node:path";
import fsp from "node:fs/promises";
import fs from "node:fs";
import Log from "$src/log";
import { EventEmitter } from "node:events";
import Rcon from "$src/game/rcon";
import { flags } from "$src/consts";
import Server from "$src/net/server";
import { Recieves } from "$types/messages";
import Close from "$src/close";
import { watch, type FSWatcher } from "chokidar";
import { basename } from "node:path";

interface DemosEvents {
    create: [demo: string];
}

export default class Demos {
    static demosPath: string | null = null;
    static watchInterval = 5000;
    static events = new EventEmitter<DemosEvents>();
    static firstDemo = true;

    static init() {
        const tfPath = Settings.get("tfPath");
        if(tfPath) {
            this.demosPath = join(tfPath, "demos");
            this.watchDemos();
        }

        Settings.on("tfPath", (path) => {
            this.demosPath = join(path, "demos");
            this.watchDemos();
        });

        Server.on(Recieves.PlayDemo, async (demo: string, { reply }) => {
            const success = await this.playDemo(demo);
            reply(success);
        });

        Close.on("close", () => this.closeDemo());
    }

    static watcher?: FSWatcher;
    static watchDemos() {
        this.watcher?.close();

        this.watcher = watch(this.demosPath, {
            ignored: (file, stat) => stat?.isFile() && !file.endsWith(".dem"),
            persistent: false,
            ignoreInitial: true,
            depth: 1
        });

        this.watcher.on("add", (path) => {
            this.closeDemo();
            
            const file = basename(path);
            Log.info("Demo created:", file);
            this.events.emit("create", file);
            this.startSession(file);
        });
    }

    static async playDemo(demo: string) {
        const path = join(this.demosPath, demo);
        if(!await fsp.exists(path)) {
            Log.error("Demo not found:", path);
            return false;
        }

        Rcon.run(`playdemo demos/${demo}`);
        return true;
    }

    static masterbaseUrl = "megaanticheat.com";
    static async closeLastSession() {
        const key = Settings.get("masterbaseKey");
        if(!key) return;

        const params = new URLSearchParams({
            api_key: key
        });

        await fetch(`https://${this.masterbaseUrl}/close_session?${params.toString()}`)
            .catch(err => Log.error("Failed to close masterbase session:", err));
    }

    static watchingDemo: string | null = null;
    static lastPos = 0;
    static async startSession(name: string) {
        if(flags.noMAC) return;
        
        const key = Settings.get("masterbaseKey");
        if(!key) return;

        if(this.firstDemo) {
            // We might not have shut down gracefully, so we need to close the last session
            await this.closeLastSession();
            this.firstDemo = false;
        }

        const path = join(this.demosPath, name);
        const content = await fsp.readFile(path);

        const ip = content.subarray(0x10, 0x114).toString().replaceAll("\0", "");
        const map = content.subarray(0x218, 0x31C).toString().replaceAll("\0", "");

        this.watchingDemo = path;
        this.lastPos = 0;

        const params = new URLSearchParams({
            api_key: key,
            fake_ip: ip,
            map,
            demo_name: name
        });

        const onErr = (err: any) => {
            Log.error("Failed to start masterbase session:", err);
        }

        fetch(`https://${this.masterbaseUrl}/session_id?${params.toString()}`)
            .then(res => {
                if(res.status !== 200) {
                    res.text().then(onErr, onErr);
                    return;
                }

                res.text().then((text) => this.openDemoWebsocket(key, text), onErr);
            })
            .catch(onErr);
    }
    
    static readTimer?: Timer;
    // Changes to the demo is buffered and only written every now and then
    static readInterval = 10000;
    static ws: WebSocket | null = null;
    static async openDemoWebsocket(key: string, sessionIdJson: string) {
        // The session id is a number but it's way too big to safely store in a 64 bit float
        let id = sessionIdJson.slice(sessionIdJson.lastIndexOf(":") + 1, -1).trim();

        let params = new URLSearchParams({
            api_key: key,
            session_id: id
        });

        this.ws = new WebSocket(`wss://${this.masterbaseUrl}/demos?${params.toString()}`);

        this.ws.addEventListener("error", (err) => {
            Log.error(`Failed to connect to masterbase websocket: ${err}`);
        });

        this.ws.addEventListener("close", (e) => {
            clearInterval(this.readTimer);
            Log.info(`Masterbase websocket closed (code ${e.code}, reason: ${e.reason})`);
        });

        this.ws.addEventListener("open", () => {
            Log.info("Connected to masterbase websocket");
            this.readTimer = setInterval(() => this.updateDemo(), this.readInterval).unref();
        });
    } 

    static async updateDemo() {
        Rcon.run("ds_status").then((status) => {
            if(status && status.startsWith("(Demo Support) Not currently recording")) {
                this.closeDemo();
            }
        });

        try {
            const stream = fs.createReadStream(this.watchingDemo, {
                start: this.lastPos
            });

            stream.on("data", (buffer) => {
                this.lastPos += buffer.length;
                this.ws.send(buffer as any); // Types are weird here
            });
        } catch {
            Log.warning("Failed to read demo file, has it been deleted?");
            this.closeLastSession();
            if(this.ws) this.ws.close();
        }
    }

    static closeDemo() {
        if(!this.watchingDemo) return;

        Log.info("Closing demo session");
        
        this.closeLastSession();
        if(this.ws) this.ws.close();
        clearInterval(this.readTimer);
        this.watchingDemo = null;
    }
}