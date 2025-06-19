import Settings from "src/settings/settings";
import { join } from "node:path";
import { watch } from "node:fs";
import fsp from "node:fs/promises";
import fs from "node:fs";
import Log from "src/log";
import { EventEmitter } from "node:events";
import History from "./history";
import Rcon from "src/game/rcon";

export default class Demos {
    static demosPath: string;
    static watchInterval = 5000;
    static events = new EventEmitter();
    static recentDemos: string[] = [];

    static init() {
        this.demosPath = join(Settings.get("tfPath"), "demos");
        this.watchDemos();

        // We might not have shut down gracefully, so we need to close the last session
        this.closeLastSession();

        History.events.on("gameEnd", () => this.closeDemo());
    }

    static watchDemos() {
        try {
            watch(this.demosPath, null, async (event, file) => {
                const name = file.toString();
                if(event === "change" || !name.endsWith(".dem")) return;

                let exists = await fsp.exists(join(this.demosPath, name));
                if(!exists) return;
                
                // fs.watch often fires multiple times for the same file
                if(this.recentDemos.includes(name)) return;

                this.recentDemos.push(name);
                if(this.recentDemos.length > 10) this.recentDemos.shift();

                this.closeDemo();

                Log.info("Demo created:", name);
                this.events.emit("create", name);
                this.onDemoCreated(name);
            });
        } catch {
            setTimeout(() => this.watchDemos(), this.watchInterval);
        }
    }

    static masterbaseUrl = "megaanticheat.com";
    static closeLastSession() {
        const key = Settings.get("masterbaseKey");
        if(!key) return;

        const params = new URLSearchParams({
            api_key: key
        });

        fetch(`https://${this.masterbaseUrl}/close_session?${params.toString()}`)
            .catch(err => Log.error("Failed to close masterbase session:", err));
    }

    static watchingDemo: string | null = null;
    static lastPos = 0;
    static async onDemoCreated(name: string) {
        const key = Settings.get("masterbaseKey");
        if(!key) return;

        const path = join(this.demosPath, name);
        let content = await fsp.readFile(path);

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
            this.readTimer = setInterval(() => this.updateDemo(), this.readInterval);
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
                this.ws.send(buffer);
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
        
        // The session is automatically ended when the websocket is closed
        if(this.ws) this.ws.close();
        clearInterval(this.readTimer);
        this.watchingDemo = null;
    }
}