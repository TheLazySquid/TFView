import { Message, type MessageTypes, type RecievedMessage, type RecievesTypes, type SentMessage } from "$types/messages";
import { networkPort } from "$shared/consts";
import type { Tag } from "$types/data";

type Status = "idle" | "connecting" | "connected" | "disconnected";

class WSClient {
    route = "";
    pollInterval = 1000;
    timeout = 5000;
    ws?: WebSocket;
    listeners = new Map<any, (data: any) => void>();
    replies = new Map<string, (data: any) => void>();
    status: Status = $state("idle");
    switchCallbacks = new Map<string, () => void>();

    init(route: string) {
        this.route = route;
        
        if(this.ws) {
            this.ws.send(JSON.stringify({ navigate: route }));

            for(let callback of this.switchCallbacks.values()) {
                callback();
            }
        } else {
            this.status = "connecting";
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

    onSwitch(id: string, callback: () => void) {
        this.switchCallbacks.set(id, callback);
    }

    on<C extends MessageTypes["channel"]>(channel: C, callback: (data: Extract<MessageTypes, SentMessage<C, any>>["data"]) => void) {
        this.listeners.set(channel, callback);
    }

    send<C extends RecievesTypes["channel"]>(channel: C, data: Extract<RecievesTypes, RecievedMessage<C, any, any>>["data"]) {
        if(!this.ws || this.ws.readyState === 3) return;
        this.ws.send(JSON.stringify({ channel, data }));
    }

    sendAndRecieve<C extends RecievesTypes["channel"]>(channel: C, data: Extract<RecievesTypes, RecievedMessage<C, any, any>>["data"]):
        Promise<Extract<RecievesTypes, RecievedMessage<C, any, any>>["replyType"]> {
        return new Promise(async (res, rej) => {
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
        this.setup?.();
    }

    setup?(): void;
}

export abstract class PageStateWithTags extends PageState {
    tags: Tag[] = $state.raw([]);
    
    init() {
        super.init();
        WS.on(Message.Tags, (tags) => {
            this.tags = tags;
        });
    }
}

export default WS;