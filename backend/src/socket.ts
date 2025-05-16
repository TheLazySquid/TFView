import type { MessageTypes } from "$types/messages";

type Type = keyof MessageTypes;
type WS = Bun.ServerWebSocket<{ type: Type }>;

export default class Socket {
    static port = 7523;
    static types: Type[] = ["game"];
    static sockets = new Map<Type, WS[]>();
    static connectListeners = new Map<Type, (callback: (channel: any, data: any) => void) => void>();

    static init() {
        for(let type of this.types) this.sockets.set(type, []);

        // listen for websocket connections
        Bun.serve({
            fetch: (req, server) => {
                let type = req.url.split("/").pop();
                if(!this.types.includes(type as Type)) {
                    return new Response("Invalid type", { status: 400 });
                }

                let data = { type };
                if (server.upgrade(req, { data })) return;

                return new Response("Upgrade failed", { status: 500 });
            },
            websocket: {
                message: () => {},
                open: (ws: WS) => {
                    this.sockets.get(ws.data.type).push(ws);
                    const listener = this.connectListeners.get(ws.data.type);
                    if(!listener) return;

                    listener((channel, data) => {
                        ws.send(channel.toString() + JSON.stringify(data));
                    });
                },
                close: (ws: WS) => {
                    const sockets = this.sockets.get(ws.data.type);
                    const index = sockets.findIndex(s => s == ws);
                    if(index === -1) return;

                    sockets.splice(index, 1);
                }
            },
            port: this.port
        });
    }

    static onConnect<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, callback: (send: (channel: C, data: MessageTypes[T][C]) => void) => void) {
        this.connectListeners.set(type, callback);
    }

    static send<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, channel: C, data: MessageTypes[T][C]) {
        const websockets = this.sockets.get(type);

        for(let ws of websockets) {
            ws.send(channel.toString() + JSON.stringify(data));
        }
    }
}