export default class WSClient<T> {
    port = 7523;
    ws: WebSocket;
    listeners = new Map<keyof T, (data: any) => void>();
    
    constructor(route: string) {
        this.ws = new WebSocket(`ws://localhost:${this.port}/${route}`);

        this.ws.addEventListener("message", (event) => {
            let type: keyof T = event.data[0];
            let data = JSON.parse(event.data.slice(1));
            this.listeners.get(type)?.(data);
        });
    }

    on<Key extends keyof T>(type: Key, callback: (data: T[Key]) => void) {
        this.listeners.set(type, callback);
    }
}