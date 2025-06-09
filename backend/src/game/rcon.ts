import RconServer from "rcon-srcds";
import Settings from "../settings/settings";
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
            port: Settings.get("rconPort")
        });

        this.connect();
    }
    
    static connect() {
        const pollReconnect = () => {
            setTimeout(() => this.connect(), this.pollInterval);
        }

        const password = Settings.get("rconPassword");
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

    static run(command: string) {
        return new Promise<string | null>((res) => {
            this.server.execute(command)
                .then((response) => res(response.toString()))
                .catch(() => res(null));
        });
    }
}