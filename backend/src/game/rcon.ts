import RconServer from "rcon-srcds";
import Settings from "../settings/settings";
import History from "src/history/history";
import Log from "src/log";
import Server from "src/net/server";
import { Recieves } from "$types/messages";

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
    }
    
    static connect() {
        const pollReconnect = () => {
            setTimeout(() => this.connect(), this.pollInterval);
        }

        const password = Settings.get("rconPassword");
        if(!password) return pollReconnect();

        this.server.authenticate(password)
            .then(() => {
                this.connected = true;
                Log.info("RCON Connected");
                
                this.server.connection.once("close", () => {
                    this.connected = false;
                    this.server.disconnect();
                    History.onGameEnd();
                    Log.info("RCON Disconnected");
                    pollReconnect();
                });
            })
            .catch(pollReconnect);
    }

    static run(command: string) {
        return new Promise<string | null>((res) => {
            this.server.execute(command)
                .then((response) => res(response.toString()))
                .catch(() => res(null));
        });
    }
}