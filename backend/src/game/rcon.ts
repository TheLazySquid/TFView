import RconServer from "rcon-srcds";
import Settings from "../settings/settings";
import History from "$src/history/history";
import Log from "$src/log";
import Server from "$src/net/server";
import { Message, Recieves } from "$types/messages";
import EventEmitter from "node:events";
import Close from "$src/close";

interface RconEvents {
    connect: [];
    disconnect: [];
}

export default class Rcon {
    static server: RconServer;
    static pollInterval = 1000;
    static connected = false;
    static events = new EventEmitter<RconEvents>();

    static init() {
        // @ts-ignore for some reason bundlers get confused with the import
        const Rcon: typeof RconServer = RconServer.default ?? RconServer;

        this.server = new Rcon({
            host: "127.0.0.1",
            port: Settings.get("rconPort"),
            encoding: "utf8"
        });

        Settings.on("rconPort", (port) => {
            if(this.connected) return;
            this.server.port = port;
            this.server.disconnect();
        });

        this.connect();

        Server.on(Recieves.KickPlayer, ({ userId, reason }) => {
            this.run(`callvote kick "${userId} ${reason}"`)
        });

        Server.on(Recieves.CloseGame, () => {
            this.run("quit");
        });

        Server.onConnect("global", (reply) => {
            reply(Message.RconConnected, this.connected);
        });

        Close.on("close", () => this.server?.disconnect());
    }

    static setConnected(connected: boolean) {
        if(this.connected === connected) return;

        this.connected = connected;
        Server.send("global", Message.RconConnected, connected);

        if(connected) {
            Log.info(`RCON connected`);
            Server.send("global", Message.Success, "Connected to TF2 console");
            this.events.emit("connect");
        } else {
            Log.warning(`RCON disconnected`);
            Server.send("global", Message.Warning, "Disconnected from TF2 console");
            this.events.emit("disconnect");
        }
    }

    static connect() {
        const pollReconnect = () => {
            if(Close.isClosed) return;
            setTimeout(() => this.connect(), this.pollInterval).unref();
        }

        const password = Settings.get("rconPassword");
        if(!password) return pollReconnect();

        this.server.authenticate(password)
            .then(() => {
                this.setConnected(true);
                
                this.server.connection.once("close", () => {
                    if(Close.isClosed) return;

                    this.setConnected(false);
                    this.server.disconnect();
                    History.onGameEnd();
                    pollReconnect();
                });
            })
            .catch(pollReconnect);
    }

    static run(command: string, timeoutMs?: number) {
        return new Promise<string | null>((res) => {
            // For some reason every hour or two the server won't respond to the command
            // This is technically a memory leak but it's incredibly insignificant
            let timeout: Timer | null = null;
            if(timeoutMs) {
                timeout = setTimeout(() => {
                    Log.warning(`RCON command timed out: ${command}`);
                    res(null);
                }, timeoutMs);
                timeout.unref();
            }

            this.server.execute(command)
                .then((response) => res(response.toString()))
                .catch(() => res(null))
                .finally(() => clearTimeout(timeout));
        });
    }
}