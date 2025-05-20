import RconServer from "rcon-srcds";
import Config from "../config";
import { fakeData } from "src/consts";
import History from "src/history/history";

export default class Rcon {
    static server: RconServer;
    static pollInterval = 1000;
    static connected = false;

    static init() {
        if(fakeData) return;
        
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
                console.log("RCON Connected");
                
                this.server.connection.once("close", () => {
                    this.connected = false;
                    History.onGameEnd();
                    console.log("RCON Disconnected");
                    pollReconnect();
                });
            })
            .catch(pollReconnect);
    }
}