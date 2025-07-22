import RconServer from "rcon-srcds";
import Settings from "../settings/settings";
import History from "src/history/history";
import Log from "src/log";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";

export default class Rcon {
    static server: RconServer;
    static pollInterval = 1000;
    static connected = false;

    static init() {        
        this.server = new RconServer({
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
    }

    static setConnected(connected: boolean) {
        if(this.connected === connected) return;

        this.connected = connected;
        Server.send("global", Message.RconConnected, connected);

        if(connected) {
            Log.info(`RCON connected`);
            Server.send("global", Message.Success, "Connected to TF2 console");
        } else {
            Log.warning(`RCON disconnected`);
            Server.send("global", Message.Warning, "Disconnected from TF2 console");
        }
    }
    

    static isClosed = false;
    static reconnectTimeout: Timer;
    static close() {
        this.server.disconnect();
        this.isClosed = true;
        if(this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    }

    static connect() {
        const pollReconnect = () => {
            if(this.isClosed) return;
            this.reconnectTimeout = setTimeout(() => this.connect(), this.pollInterval);
        }

        const password = Settings.get("rconPassword");
        if(!password) return pollReconnect();

        this.server.authenticate(password)
            .then(() => {
                this.setConnected(true);
                
                this.server.connection.once("close", () => {
                    this.setConnected(false);
                    
                    this.server.disconnect();
                    History.onGameEnd();
                    pollReconnect();
                });
            })
            .catch(pollReconnect);
    }

    static timeout = 5000;
    static run(command: string) {
        return new Promise<string | null>((res) => {
            // For some reason every hour or two the server won't respond to the command
            // This is technically a memory leak but it's incredibly insignificant
            let timeout = setTimeout(() => {
                Log.warning(`RCON command timed out: ${command}`);
                res(null);
            }, this.timeout);

            this.server.execute(command)
                .then((response) => res(response.toString()))
                .catch(() => res(null))
                .finally(() => clearTimeout(timeout));
        });
    }
}