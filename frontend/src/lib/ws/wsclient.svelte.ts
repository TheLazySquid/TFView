import type { Message, MessageTypes, RecievesKey, RecievesTypes } from "$types/messages";
import { networkPort } from "$shared/consts";

type Status = "idle" | "connecting" | "connected" | "disconnected";

class WSClient {
    route = "";
    pollInterval = 1000;
    timeout = 5000;
    ws?: WebSocket;
    listeners = new Map<any, (data: any) => void>();
    replies = new Map<string, (data: any) => void>();
    status: Status = $state("idle");

    init(route: string) {
        this.route = route;
        this.status = "connecting";
        
        if(this.ws) {
            this.ws.send(JSON.stringify({ navigate: route }));
        } else {
            this.connectSocket();
        }
    }

    connectTimeout?: Timer;
    connectSocket() {
        const retry = () => {
            setTimeout(() => this.connectSocket(), this.pollInterval);
        }

        this.ws = new WebSocket(`ws://localhost:${networkPort}/ws/${this.route}`);

        // Kill the connection after 5 seconds
        this.connectTimeout = setTimeout(() => {
            this.ws?.close();
            this.status = "disconnected";
            retry();
        }, this.timeout);

        this.ws.addEventListener("close", () => {
            clearTimeout(this.connectTimeout);
            this.status = "disconnected";
            retry();
        }, { once: true });

        this.ws.addEventListener("open", () => {
            clearTimeout(this.connectTimeout);
            this.status = "connected";
            console.log("Websocket connected")
        }, { once: true });

        this.ws.addEventListener("message", (event) => {
            let message = JSON.parse(event.data);

            if(message.reply) {
                this.replies.get(message.reply)?.(message.data);
                this.replies.delete(message.reply);
            } else {
                this.listeners.get(message.channel)?.(message.data);
            }
        });
    }

    on<C extends Message>(type: C, callback: (data: MessageTypes[C]) => void) {
        this.listeners.set(type, callback);
    }

    send<C extends keyof RecievesTypes>(channel: C, data: RecievesKey<C, "send">) {
        if(!this.ws || this.ws.readyState === 3) return;
        this.ws.send(JSON.stringify({ channel, data }));
    }

    sendAndRecieve<C extends keyof RecievesTypes>(channel: C, data: RecievesKey<C, "send">) {
        return new Promise<RecievesKey<C, "reply">>(async (res, rej) => {
            if(!this.ws || this.ws.readyState === 3) return rej();

            if(this.ws.readyState === 0) {
                await new Promise((res) => this.ws?.addEventListener("open", res, { once: true }));
            }

            let id = crypto.randomUUID();
            this.ws.send(JSON.stringify({ id, channel, data }));
            this.replies.set(id, res);
        });
    }
}

const WS = new WSClient();

export abstract class PageState {
    abstract type: string;
    ws = WS;

    init() {
        WS.init(this.type);
        this.setup();
    }

    abstract setup(): void;
}

export default WS;