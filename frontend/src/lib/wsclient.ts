export default class WSClient<T> {
    port = 7523;
    pollInterval = 1000;
    route: string;
    listeners = new Map<keyof T, (data: any) => void>();
    
    constructor(route: string) {
        this.route = route;

        this.connectSocket();
    }

    connectSocket() {
        let ws = new WebSocket(`ws://localhost:${this.port}/${this.route}`);

        const retry = () => {
            setTimeout(() => this.connectSocket(), this.pollInterval);
        }

        ws.addEventListener("close", retry, { once: true });
        ws.addEventListener("open", () => {
            console.log("Websocket connected")
        }, { once: true });

        ws.addEventListener("message", (event) => {
            let type: keyof T = event.data[0];
            let data = JSON.parse(event.data.slice(1));
            this.listeners.get(type)?.(data);
        });
    }

    on<Key extends keyof T>(type: Key, callback: (data: T[Key]) => void) {
        this.listeners.set(type, callback);
    }
}