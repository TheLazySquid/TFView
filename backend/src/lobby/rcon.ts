import RconServer from "rcon-srcds";
import Config from "../config";
import LobbyMonitor from "./monitor";

export default class Rcon {
    static server: RconServer;
    static pollInterval = 1000;
    static connected = false;

    static init() {
        this.server = new RconServer({
            host: "127.0.0.1",
            port: Config.get("rconPort")
        });

        this.connect();
    }
    
    static connect() {
        const pollReconnect = () => {
            setTimeout(() => this.connect(), this.pollInterval);
        }

        const password = Config.get("rconPassword");
        if(!password) {
            pollReconnect();
            return;
        }

        this.server.authenticate(password)
            .then(() => {
                this.connected = true;
                this.server.connection.once("close", () => {
                    this.connected = false;
                    pollReconnect();
                });
            })
            .catch(pollReconnect);
    }
}