import type { MessageTypes, RecievedMessage, RecievesTypes, SentMessage } from "$types/messages";
import { networkPort } from "$shared/consts";
import GlobalState from "./globalState.svelte";

type Status = "idle" | "connecting" | "connected" | "disconnected";

class WSClient {
    route = "";
    pollInterval = 1000;
    timeout = 5000;
    ws?: WebSocket;
    listeners = new Map<any, ((data: any) => void)[]>();
    replies = new Map<string, (data: any) => void>();
    status: Status = $state("idle");
    switchCallbacks = new Set<() => void>();

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
        let retried = false;
        const retry = () => {
            if(retried) return;
            retried = true;

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
                this.listeners.get(message.channel)?.forEach(cb => cb(message.data));
            }
        });
    }

    onSwitch(callback: () => void) {
        this.switchCallbacks.add(callback);
    }

    offSwitch(callback: () => void) {
        this.switchCallbacks.delete(callback);
    }

    on<C extends MessageTypes["channel"]>(channel: C, callback: (data: Extract<MessageTypes, SentMessage<C, any>>["data"]) => void) {
        let listeners = this.listeners.get(channel);
        if(listeners) listeners.push(callback);
        else this.listeners.set(channel, [callback]);
    }

    off<C extends MessageTypes["channel"]>(channel: C, callback: (data: Extract<MessageTypes, SentMessage<C, any>>["data"]) => void) {
        let listeners = this.listeners.get(channel);
        if(!listeners) return;

        let index = listeners.indexOf(callback);
        if(index === -1) return;
        listeners.splice(index, 1);
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
        GlobalState.init();
        this.setup?.();
    }

    setup?(): void;
}

export default WS;