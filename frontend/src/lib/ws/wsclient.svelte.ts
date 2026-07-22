import type { ExtractMessage, ExtractRecieves, MessageTypes, Page, RecievesTypes } from "$types/messages";
import { networkPort } from "$shared/consts";

type Status = "idle" | "connecting" | "connected" | "disconnected";

class WSClient {
    page = "";
    ws?: WebSocket;
    listeners = new Map<any, ((data: any) => void)[]>();
    replies = new Map<string, (data: any) => void>();
    switchCallbacks = new Set<() => void>();
    readyRes?: () => void;
    ready = new Promise<void>((res) => this.readyRes = res);
    status: Status = $state("idle");
    closed = $state(false);
    connectTimeout?: ReturnType<typeof setTimeout>;
    hasDisconnected = false;

    init(page: Page) {
        this.page = page;

        if(this.ws) {
            this.ws.send(JSON.stringify({ navigate: page }));

            for(let callback of this.switchCallbacks.values()) {
                callback();
            }
        } else {
            this.status = "connecting";
            this.connectSocket();

            this.connectTimeout = setTimeout(() => {
                this.status = "disconnected";
            }, 5000);
        }
    }

    connectSocket() {
        let url = `ws://localhost:${networkPort}/ws/${this.page}`;
        if(this.hasDisconnected) url += "?reconnect=true";

        this.ws = new WebSocket(url);

        this.ws.addEventListener("close", () => {
            this.connectSocket();
            this.hasDisconnected = true;
            this.status = "disconnected";
            this.ready = new Promise<void>((res) => this.readyRes = res);
        }, { once: true });

        this.ws.addEventListener("open", () => {
            this.status = "connected";
            this.closed = false;
            this.readyRes?.();
            clearTimeout(this.connectTimeout);
            
            // Reset infinite lists if we reconnected
            for(let callback of this.switchCallbacks.values()) {
                callback();
            }

            console.log("Websocket connected");
        }, { once: true });

        this.ws.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            const messages = Array.isArray(data) ? data : [data];

            for(const message of messages) {
                if(message.reply) {
                    this.replies.get(message.reply)?.(message.data);
                    this.replies.delete(message.reply);
                } else {
                    this.listeners.get(message.channel)?.forEach(cb => cb(message.data));
                }
            }
        });
    }

    onSwitch(callback: () => void) {
        this.switchCallbacks.add(callback);
    }

    offSwitch(callback: () => void) {
        this.switchCallbacks.delete(callback);
    }

    on<C extends MessageTypes["channel"]>(channel: C, callback: (data: ExtractMessage<C>["data"]) => void) {
        let listeners = this.listeners.get(channel);
        if(listeners) listeners.push(callback);
        else this.listeners.set(channel, [callback]);
    }

    off<C extends MessageTypes["channel"]>(channel: C, callback: (data: ExtractMessage<C>["data"]) => void) {
        let listeners = this.listeners.get(channel);
        if(!listeners) return;

        let index = listeners.indexOf(callback);
        if(index === -1) return;
        listeners.splice(index, 1);
    }

    send<C extends RecievesTypes["channel"]>(channel: C, data: ExtractRecieves<C>["data"]) {
        if(!this.ws || this.ws.readyState === 3) return;
        this.ws.send(JSON.stringify({ channel, data }));
    }

    async sendAndRecieve<C extends RecievesTypes["channel"]>(channel: C, data: ExtractRecieves<C>["data"]): Promise<ExtractRecieves<C>["replyType"]> {
        await this.ready;

        return new Promise((res) => {
            const id = crypto.randomUUID();
            this.ws!.send(JSON.stringify({ id, channel, data }));
            this.replies.set(id, res);
        });
    }
}

const WS = new WSClient();
export default WS;