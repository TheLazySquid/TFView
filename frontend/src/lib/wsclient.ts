import type { MessageTypes, RecievesTypes } from "$types/messages";

export default class WSClient<T extends keyof MessageTypes> {
    port = 7523;
    pollInterval = 1000;
    ws: WebSocket | undefined;
    route: string;
    listeners = new Map<keyof MessageTypes[T], (data: any) => void>();
    
    constructor(route: string) {
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
            let data = JSON.parse(event.data.slice(1));
            this.listeners.get(type)?.(data);
        });
    }

    on<Key extends keyof MessageTypes[T]>(type: Key, callback: (data: MessageTypes[T][Key]) => void) {
        this.listeners.set(type, callback);
    }

    send<Key extends keyof RecievesTypes[T]>(type: Key, data: RecievesTypes[T][Key]) {
        if(!this.ws || this.ws.readyState === 3) return;
        this.ws.send(type.toString() + JSON.stringify(data));
    }
}