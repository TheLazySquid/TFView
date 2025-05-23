import type { MessageTypes, RecievesKey, RecievesTypes } from "$types/messages";

class WSClient<T extends keyof MessageTypes = any> {
    route = "";
    port = 7523;
    pollInterval = 1000;
    ws: WebSocket | undefined;
    listeners = new Map<keyof MessageTypes[T], (data: any) => void>();
    replies = new Map<keyof RecievesTypes, ((data: any) => void)[]>();

    init(route: string) {
        this.route = route;
        this.connectSocket();
    }

    connectSocket() {
        this.ws = new WebSocket(`ws://localhost:${this.port}/${this.route}`);

        const retry = () => {
            setTimeout(() => this.connectSocket(), this.pollInterval);
        }

        this.ws.addEventListener("close", retry, { once: true });
        this.ws.addEventListener("open", () => {
            console.log("Websocket connected")
        }, { once: true });

        this.ws.addEventListener("message", (event) => {
            let type = event.data[0];

            if(type === "r") {
                // handle replies
                let channel = event.data[1];
                let data = JSON.parse(event.data.slice(2));
                
                // this assumes that replies are going to arrive in the same order that they are sent
                this.replies.get(channel)?.shift()?.(data);
            } else {
                let data = JSON.parse(event.data.slice(1));
                this.listeners.get(type)?.(data);    
            }
        });
    }

    on<C extends keyof MessageTypes[T]>(type: C, callback: (data: MessageTypes[T][C]) => void) {
        this.listeners.set(type, callback);
    }

    send<C extends keyof RecievesTypes>(type: C, data: RecievesKey<C, "send">) {
        if(!this.ws || this.ws.readyState === 3) return;
        this.ws.send(type.toString() + JSON.stringify(data));
    }

    sendAndRecieve<C extends keyof RecievesTypes>(type: C, data: RecievesKey<C, "send">) {
        return new Promise<RecievesKey<C, "reply">>(async (res, rej) => {
            if(!this.ws || this.ws.readyState === 3) return rej();
            if(this.ws.readyState === 0) {
                await new Promise((res) => this.ws?.addEventListener("open", res, { once: true }));
            }

            this.ws.send(type.toString() + JSON.stringify(data));

            if(!this.replies.has(type)) this.replies.set(type, []);
            this.replies.get(type)?.push(res);
        });
    }
}

const WS = new WSClient();

export abstract class PageState<T extends keyof MessageTypes> {
    abstract type: string;
    ws = WS as WSClient<T>;

    init() {
        WS.init(this.type);
        this.setup();
    }

    abstract setup(): void;
}

export default WS;